const { Task } = require("../models/taskModel")


const allTask = async(req, res) => {
    try{
        const userId = req.user._id;
        const tasks = await Task.find({user_id: userId})
        res.status(200).json({"Your tasks": tasks})

    } catch(error){
        console.log(error)
        res.status(500).json("Internal error occurred")
    }
}

const createTask = async(req, res) => {
    try {
        const userId = req.user._id;
        const task = new Task({...req.body, user_id:userId})
        await task.save()
        res.status(201).json({"New task created": task})
    } catch (error) {
        console.log(error)
        res.status(500).json("Error occurred while creating task")
    }
}

module.exports = {createTask, allTask}