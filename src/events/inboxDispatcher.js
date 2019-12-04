const events = require("events");
const userModel = require("../models/user");
const BugModel = require("../models/bug");
const inboxModel = require("../models/inbox");
const projectModel = require("../models/project");
const eventEmitter = new events.EventEmitter();

eventEmitter.on("bugUpdateInbox", async data => {
  let bug = await BugModel.findById(data.bugId);
  let devs = bug.assignedDev.map(obj => {
    return obj.userId;
  });
  devs = devs.filter(el => el != null);
  let users = await userModel.find({
    _id: {
      $in: devs
    }
  });

  users.forEach(async user => {
    let inbox = new inboxModel({
      userId: user._id,
      projectId: data.projectId,
      bugId: bug._id,
      title: data.title,
      message: data.message,
      type: data.type, // 1-proj, 2-bug-assigned ,3-bug-created/edit, 4-misc
      sourceName: data.creatorName, //Name
      sourceId: data.sourceId,
      projName: data.projectTitle,
      read: 0
    });
    await inbox.save();
  });
});

eventEmitter.on("removefrombugs", async data => {
  const projectId = data.projectId;
  const userId = data.removalId;

  let project;
  try {
    project = await projectModel.findById(projectId);
    project.bugAssigned.forEach(bugId => {
        let bug = await BugModel.findById(bugId);
        bug.assignedDev.filter(user => JSON.stringify(user.userId) !== JSON.stringify(userId));
        await bug.save(); 
    })
  } catch (error) {
    console.log(error);
  }
});

module.exports = eventEmitter;
