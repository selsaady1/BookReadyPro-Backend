const Router = require('koa-router');
const { User,File,OutputFile } = require('../models');
const router = new Router();
const { saveFile,deleteFile,retrieveFile,getFileStream} = require('../utils/fileManagement')
fs = require('fs');
const crypto = require('crypto');
const {boss} = require('../jobs')
router.post('/file',  async (ctx) => { 
    const user = ctx.state.user
    if( user.credit >=1){
    try{
    const file = ctx.request.files.file
    const fileBytes = fs.readFileSync(file.path)
    const newFile =await File.create({name:file.name,url:file.path,userId:user.id})
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
    await boss.publish('excel', { balance_sheet: filekey, name:`${newFile.id}-${file.name}`,realName:file.name,userId:user.id,fileId:newFile.id, exists:!!exists})
    newFile.save()
    if(!exists){
        user.credit = user.credit-1
        await user.save()
    }

    ctx.body={success:true,credit:user.credit}
    }
    catch(Err){
        console.error('error',Err)
        ctx.throw(401,"Problem happened")
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
       files :files,
       credit:user.credit
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