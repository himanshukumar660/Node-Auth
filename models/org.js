var mongoose = require('mongoose');
// var uniqueValidator = require('mongoose-unique-validator');
var randomstring = require('randomstring');
var SALT_WORK_FACTOR = 10;

mongoose.connect("mongodb://127.0.0.1:27017/orgs");

var db = mongoose.connection;

var Schema = mongoose.Schema;

var orgSchema = new Schema({
	//Name of the author
	name: {
		type: String,
		unique: true,
		required: true
	},
	//date the organisation registered
	dateMade: {
		type: Date
	},
	//About the organisation
	aboutUs: {
		type: String,
		unique: true,
		required: true
	},
	//Listing of all the members
	members: [String],
	//Listing of Admins
	admin: [String],
	//The users those have requested to join
	pendingRequest : [String],
});


var Org = module.exports = mongoose.model('Org', orgSchema);

module.exports.makeOrg = function(orgDetails, callback){
	//INCOMPLETE
	// if org name exists
	// 	throw an error
	// else make an organisation
	// 	also make the user that have made the organisation as admin

	orgDetails.dateMade = new Date();
	orgDetails.save(callback);
}

module.exports.makeUserAdmin = function(orgId, username, callback){
	// if already an Admin Do nothing
	// else
	// 	make him admin
	
	Org.findOneAndUpdate({_id: orgId}, {$addToSet: {admin : username}}, callback);
}

module.exports.enterOrg = function(orgId,  username, callback){
	// If the user already exists in the organisation 
	// 	do nothing
	// else
	// 	make him a member of the organisation

	Org.findOneAndUpdate({_id: orgId}, {$addToSet: {pendingRequest : username}}, callback);
}


module.exports.acceptPendingReq = function(orgId, usernameOfReqUser,callback){
	//Accepting Pending requests can be only performed by the admins.

	//Remove from the pending request fields
	Org.findOneAndUpdate({_id: orgId}, {$pull: {pendingRequest : usernameOfReqUser}});
	//Add to the members field
	Org.findOneAndUpdate({_id: orgId}, {$addToSet: {members : usernameOfReqUser}}, callback);
}

module.exports.acceptPendingReq = function(orgId, usernameOfReqUser, callback){
	//Accepting Pending requests can be only performed by the admins.

	//Remove from the pending request fields
	Org.findOneAndUpdate({_id: orgId}, {$pull: {pendingRequest : usernameOfReqUser}});
	//Add to the members field
	Org.findOneAndUpdate({_id: orgId}, {$addToSet: {members : usernameOfReqUser}}, callback);
}

module.exports.deleteOrg = function(orgId, usernameAdmin, callback){
	//Search the entire org list that contails both the organisationID and admin contains the username Admin  
	Org.remove({$and : [{_id: OrgId, admin: {$in : [usernameAdmin]}}]}, callback);
}

module.exports.exitOrgMember = function(orgId, username, callback){
	//find the member from member list and remove him
	Org.findOneAndUpdate({_id: orgId}, {$pull : {members : username}}, callback);
}

module.exports.exitOrgAdmin = function(orgId, username, callback){
	//find the Admin from Admin list and remove him
	Org.findOneAndUpdate({_id: orgId}, {$pull : {admin : username}}, callback);
}

module.exports.chkAdmin = function(orgId, username, callback){
	Org.find({$and : [{_id:orgId, admin : {$in : [username]}}]}, callback);
}

module.exports.chkMember = function(orgId, username, callback){
	Org.find({$and : [{_id:orgId, members : {$in : [username]}}]}, callback);
}

