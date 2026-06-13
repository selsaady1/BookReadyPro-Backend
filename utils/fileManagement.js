
class AWSFiles {

	constructor() {
		this.s3 = new (require('aws-sdk/clients/s3'))()
		
		this.permanentBucket = process.env.SYNTHEIA_STORAGE_BUCKET || 'bookready-files';
	}

	async store(content, name) {
		await this.s3.putObject({
			Bucket: this.permanentBucket,
			Key: name,
			Body: content,
		}).promise();
	}

	async load(name) {
		const result = await this.s3.getObject({
			Bucket: this.permanentBucket,
			Key: name,
		}).promise();

		return result.Body;
	}

	async readStream(name) {
		return this.s3.getObject({
			Bucket: this.permanentBucket,
			Key: name,
		}).createReadStream();
	}

	async delete(name) {
		await this.s3.deleteObject({
			Bucket: this.permanentBucket,
			Key: name
		}).promise();
	}
}

const files = new AWSFiles();

 async function saveFile(content, name) {
	await files.store(content, String(name));
}

 async function retrieveFile(name) {
	return files.load(String(name));
}

 async function getFileStream(name) {
	return files.readStream(String(name));
}

 async function deleteFile(name) {
	await files.delete(String(name));
}

module.exports = {
    saveFile,
    retrieveFile,
    deleteFile,
    getFileStream
}
