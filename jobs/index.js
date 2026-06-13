const PgBoss = require('pg-boss');

const user = process.env.database_user
const host = process.env.database_host
const password = process.env.database_password
const database = process.env.database_name
const boss = new PgBoss(`postgres://${user}:${password}@${host}/${database}`);
const axios = require('axios');

const { User,File,OutputFile } = require('../models');

const promisesRunning = []
async function init() {

  
    boss.on('error', error => console.error(error));
  
    await boss.start();
  
    const queue = 'excel';
  
    // let jobId = await boss.publish(queue, { balance_sheet: '1/9/WSF-2020.xlsx' , name:'9-WSF-2020.xlsx', userId:1,fileId:9})
  
    // console.log(`created job in queue ${queue}: ${jobId}`);
  
    await boss.subscribe(queue, documentJobHandler);
  }
  
  async function documentJobHandler(job) {
    console.log("workinggg")
    console.log(`job ${job.id} received with data:`);
    console.log(JSON.stringify(job.data));
    console.log('waiting')
    await Promise.all(promisesRunning)
    console.log('finished waiting')
    let promiseJob = axios.post(process.env.excel_processing_endpoint, job.data)
    .then(res=>{
        console.log('res', res.data)
         OutputFile.create({name:`${job.data.realName.split('.')[0]}_Transaction Analysis.xlsx`,
         url:res.data.transaction_analysis,
         userId:job.data.userId,
         parentFileId:job.data.fileId
        })
        OutputFile.create({name:`${job.data.realName.split('.')[0]}_Categorized Items / Breakdown.xlsx`,
        url:res.data.grouped_sheet,
        userId:job.data.userId, 
        parentFileId:job.data.fileId
       })

    }).catch(async error=>{
        console.log(error)
        const mainFile = await File.findOne({
            where:{
                id:job.data.fileId
            }
        })
        const user = await User.findOne({
            where:{
                id:job.data.userId
        }})
        if(!job.data.exists){
        user.credit = user.credit+1
        await user.save()
        }
        mainFile.error = " Error happend while processing the file"
        await mainFile.save()
    })

    promisesRunning.push(promiseJob)
  }

  module.exports={
      init,
      boss
  }
  