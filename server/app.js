require('dotenv').config();
const express = require('express');
const cors = require('cors');

const Tasks = require('./models/tasks.model');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.post('/tasks', async (req, res) => {
    const task = req.body;

    try {
        const existingTask = await Tasks.findOne({ where: { taskId: task.taskId } });
        if (existingTask) {
            return res.send({ success: false, error: 'Task with this ID already exists' });
        }

        await Tasks.create(task);
        return res.send({ success: true, task });
    } catch (error) {
        console.log(error);
        return res.send({ success: false, error: 'An error occurred while creating the task' });
    }
});

app.get('/tasks', async (req, res) => {
    try {
        const tasks = await Tasks.findAll({ raw: true });
        return res.send({ success: true, tasks });
    } catch (error) {
        console.log(error);
        return res.send({ success: false, error: 'An error occurred while fetching the tasks' });
    }
});

app.get('/tasks/:tid', async (req, res) => {
    try {
        const tid = req.params.tid;
        const task = await Tasks.findOne({ where: { taskId: tid }, raw: true });
        return res.send({ success: true, task });
    } catch (error) {
        console.log(error);
        return res.send({ success: false, error: 'An error occurred while fetching the task' });
    }
});

app.put('/tasks/:tid', async (req, res) => {
    try {
        const tid = req.params.tid;
        const { name, description, status } = req.body
        const task = await Tasks.update({
            name,
            description,
            status,
        }, {
            where: { taskId: tid }
        });
        return res.send({ success: true });
    } catch (error) {
        console.log(error);
        return res.send({ success: false, error: 'An error occurred while updating the task' });
    }
});

app.delete('/tasks/:tid', async (req, res) => {
    try {
        const tid = req.params.tid;
        const task = await Tasks.destroy({
            where: { taskId: tid }
        });
        return res.send({ success: true });
    } catch (error) {
        console.log(error);
        return res.send({ success: false, error: 'An error occurred while updating the task' });
    }
});

// Start server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});