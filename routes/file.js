const Router = require('koa-router');
const { User,File,OutputFile } = require('../models');
const router = new Router();
const { saveFile,deleteFile,retrieveFile,getFileStream} = require('../utils/fileManagement')
const { publicFile } = require('../utils/fileStatus');
const fs = require('fs');
const crypto = require('crypto');
const { publishDocumentJob } = require('../jobs')

function jobData(file, userId, exists) {
    return {
        balance_sheet: file.url,
        name: `${file.id}-${file.name}`,
        realName: file.name,
        userId,
        fileId: file.id,
        exists,
    };
}

router.post('/file',  async (ctx) => { 
    const user = ctx.state.user
    if( user.credit >=1){
    let newFile = null
    try{
    const file = ctx.request.files.file
    const fileBytes = fs.readFileSync(file.path)
    newFile = await File.create({name:file.name,url:file.path,userId:user.id})
    const filekey = `${user.id}/${newFile.id}/${file.name}`
  
    await saveFile(Buffer.from(fileBytes),filekey)
    newFile.url= filekey
    newFile.hash = crypto.createHash('sha1').update(fileBytes).digest('hex')
    const exists = await File.findOne({
        where:{
            hash:newFile.hash,
            error:null,
            userId:user.id
        },
        paranoid: false
    })
    await newFile.save()
    const jobId = await publishDocumentJob(jobData(newFile, user.id, !!exists))
    if(!exists){
        user.credit = user.credit-1
        await user.save()
    }

    ctx.status = 202
    ctx.body={success:true,credit:user.credit,fileId:newFile.id,jobId,status:'processing'}
    }
    catch(Err){
        console.error('[bookreadypro/upload]', Err)
        if (newFile) {
            newFile.error = 'The file could not be queued for processing'
            await newFile.save().catch(() => {})
        }
        ctx.throw(500,"The file could not be queued for processing")
    }
}
else{
    ctx.throw(400,"not enought credits")
}
})  

router.get('/files',async (ctx) => { 
    const user = ctx.state.user
    const files = await File.findAll({
        attributes: { exclude: ['userId','url'] },
        where:{
            userId:user.id,
        },
        include: {
            model:OutputFile,
            attributes:{exclude: ['userId','url']},
            as:'children'
        },
        order:[
        ['createdAt', 'DESC'],
        ]
    })
    ctx.body= {
       files :files.map((file) => publicFile(file)),
       credit:user.credit
    }
       
    })

router.post('/files/retry', async (ctx) => {
    const user = ctx.state.user
    const parentFileId = Number(ctx.request.body && ctx.request.body.parentFileId)
    if (!Number.isInteger(parentFileId) || parentFileId <= 0) ctx.throw(400, 'A valid parentFileId is required')

    const file = await File.findOne({
        where: { id: parentFileId, userId: user.id },
        include: { model: OutputFile, as: 'children' }
    })
    if (!file) ctx.throw(404, 'File not found')
    const current = publicFile(file)
    if (current.status === 'ready') {
        ctx.body = { success: true, fileId: file.id, status: 'ready', alreadyComplete: true }
        return
    }
    if (current.status === 'processing') ctx.throw(409, 'File is already processing')

    file.error = null
    await file.save()
    try {
        const jobId = await publishDocumentJob(jobData(file, user.id, true))
        ctx.status = 202
        ctx.body = { success: true, fileId: file.id, jobId, status: 'processing' }
    } catch (error) {
        console.error('[bookreadypro/retry]', error)
        file.error = 'The retry could not be queued for processing'
        await file.save().catch(() => {})
        ctx.throw(503, 'The retry could not be queued for processing')
    }
})
router.get('/download/file',async(ctx)=>{
    const user = ctx.state.user
    let { outputFileId, parentFileId} = ctx.request.query
    let file = null
    if(outputFileId)
       file = await OutputFile.findOne({
            where:{
                id:outputFileId,
                userId:user.id
            }
        })
    else if (parentFileId){
        file = await File.findOne({
            where:{
                id:parentFileId,
                userId:user.id
            }
        })
    }

    if(file === null)
        ctx.throw(401, "Not found s")

   const downloadFile = await getFileStream(file.url)
   let contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
   if(file.name.includes('csv')){
       console.log('csssv')
    contentType = 'text/csv';
   }
    ctx.res.writeHead(200, {
        'Content-Type': `${contentType}`,
        "Content-Disposition": `attachment; filename=${file.name}`,
      });
    //   return new Promise(resolve => ctx.res.on('finish', resolve));
      ctx.body= downloadFile

})

router.delete('/files',async (ctx) => { 
    const user = ctx.state.user
    const { outputFileId, parentFileId} = ctx.request.body
    console.log('heeer',ctx.request.body)
    if(outputFileId)
        await OutputFile.destroy({
            where:{
                id:outputFileId,
                userId: user.id
            }
        })
    else if(parentFileId)
       await File.destroy({
            where:{
                id:parentFileId,
                userId: user.id
            }
        })
        else
        ctx.throw(401, "Not found ")

ctx.body = { success: true };

})

module.exports = router
