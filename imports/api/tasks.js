import {Meteor} from 'meteor/meteor';
import {Mongo} from 'meteor/mongo';
import {check} from 'meteor/check';

export const Tasks = new Mongo.Collection('tasks');

// TasksSchema = new SimpleSchema({
//     name: {
//         type: String,
//         label: "Name"
//     },
//     desc: {
//         type: String,
//         label: "Description"
//     },
//     author: {
//         type: String,
//         label: "Author",
//         autoValue: function() {
//             return this.userId
//         }
//     },
//     createdAt: {
//         type: Date,
//         label: "Created At",
//         autoValue: function() {
//             return new Date()
//         }
//     }
// });
//
// Tasks.attachSchema(TasksSchema);

if (Meteor.isServer) {
    // This code only runs on the server
    // Only publish tasks that are public or belong to the current user
    Meteor.publish('tasks', function tasksPublication() {
        return Tasks.find({
            $or: [{
                private: {
                    $ne: true
                }
            }, {
                owner: this.userId
            },],
        });
    });
}

Meteor.methods({
    'tasks.insert' (text) {
        check(text, String);

        // Make sure the user is logged in before inserting a task
        if (!Meteor.userId()) {
            throw new Meteor.Error('not-authorized');
        }

        Tasks.insert({
            text,
            createdAt: new Date(),
            owner: Meteor.userId(),
            username: Meteor.user().username,
            // status: "Open",
            statusOpen: true,
            acceptedAt: "None",
            acceptedBy: "None"
        });
    },
    'tasks.remove' (taskId) {
        check(taskId, String);

        const task = Tasks.findOne(taskId);


        if (task.private && task.owner !== Meteor.userId()) {
            // If the task is private, make sure only the owner can delete it
            throw new Meteor.Error('not-authorized');
        }

        if (task.owner !== Meteor.userId() && Meteor.user().username !== "admin") {
            throw new Meteor.Error('not-authorized');
        }

        Tasks.remove(taskId);


    },
    'tasks.setChecked' (taskId, setChecked, setStatusOpen, setAcceptedBy) {
        check(taskId, String);
        check(setChecked, Boolean);
        check(setStatusOpen, Boolean);
        // check(setAcceptedBy, String);

        const task = Tasks.findOne(taskId);

        if (Meteor.userId() === null) {
            throw new Meteor.Error('Must be logged in to accept a job.')
        }
        if (task.owner === Meteor.userId()) {
            throw new Meteor.Error('Cannot accept your own offer!')
        }
        // if (task.private && task.owner !== Meteor.userId()) {
        //     // If the task is private, make sure only the owner can check it off
        //     throw new Meteor.Error('not-authorized');
        // }

        if (setStatusOpen) {
            acceptedToggle = null
        }
        else acceptedToggle = new Date();

        Tasks.update(taskId, {
            $set: {
                checked: setChecked,
                // status: "Accepted",
                statusOpen: setStatusOpen,
                acceptedAt: acceptedToggle,
                acceptedBy: Meteor.user().username
            }
        });
    },

    'tasks.setPrivate' (taskId, setToPrivate) {
        check(taskId, String);
        check(setToPrivate, Boolean);

        const task = Tasks.findOne(taskId);

        // Make sure only the task owner can make a task private
        if (task.owner !== Meteor.userId()) {
            throw new Meteor.Error('not-authorized');
        }

        Tasks.update(taskId, {
            $set: {
                private: setToPrivate
            }
        });
    },
});