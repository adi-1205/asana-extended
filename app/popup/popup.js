class Dom {
    static iconMap = {
        all: '⏳',
        todo: '📝',
        inprogress: '🚧',
        done: '😎',
    }

    static apiEndpoint = 'http://localhost:3000'

    static displayList() {
        $('#task-details').addClass('d-none');
        $('#task-table').removeClass('d-none');
        $('#back').addClass('hidden');
        $('#table-head').text('Tasks');
        $('.filter-wrapper').show();
        $('#more').addClass('hidden')
    }
    
    static displayDetails() {
        $('#task-details').removeClass('d-none');
        $('#task-table').addClass('d-none');
        $('#back').removeClass('hidden');
        $('#table-head').text('Deatils');
        $('.filter-wrapper').hide();
        $('#more').removeClass('hidden')
    }

    static getTaskRow(task) {
        return `
            <tr>
                <td class="task" data-id="${task.taskId}">${task.name}</td>
                <td class="status-icon">
                    ${ Dom.iconMap[task.status] }
                </td>
            <tr>
        `;  
    }

    static textLength(html){
        return html===null ? 0 : $(`
            <p>${html}</p>
            `).text().length
    }
}

$(document).ready(async function () {

    await displayAllTasks();

    $('#cat-img').attr('src', '../images/cat.gif');
    $('#fish-img').attr('src', '../images/fish.gif');

    $(document).on('click', '.task', async function(e){
        const taskId = $(this).data('id');
        const taskPromise = await fetch(`${Dom.apiEndpoint}/tasks/${taskId}`);
        const taskRes = await taskPromise.json();
    
        if (!taskRes.success) {
            return;
        }

        const task = taskRes.task;
        
        $('#task-name')
            .html(task.name);
        $('#task-details')
            .data('id', task.taskId);
        $('#status-dropdown .task-status')
            .attr('data-status', task.status);
        let statusText = $('#status-dropdown')
            .find(`.options .option[data-value="${task.status}"]`).text()
        console.log(statusText);
        
        $('#status-dropdown .status-text').text(statusText)
        if(Dom.textLength(task.description) != 0) {
            $('#task-desc')
                .removeClass('empty');
            $('#task-desc')
                .html(task.description);
        }
    
        Dom.displayDetails();
    });

    $(document).on('click', '#search-dropdown, #status-dropdown .task-status', function(e){
        e.stopPropagation();
        const parent = $(this)
            .closest('.status-wrapper');
        const status = $(this)
            .parent()
            .find('.task-status')
            .attr('data-status');
        $(parent)
            .find(`.options .option .check`)
            .addClass('hidden');
        $(parent)
            .find(`.options .option[data-value="${status}"]`)
            .find('.check')
            .removeClass('hidden');
        $(parent)
            .find('.options')
            .show();
    });

    $(document).on('click', '#search-dropdown .option', function(e){
        e.stopPropagation()
        const parent = $(this).closest('.status-wrapper')
        const optionText = $(this).text();
        const optionValue = $(this).attr('data-value');
        $(parent)
            .find('.status-text')
            .text(optionText);
        $(parent)
            .find('.task-status')
            .attr('data-status', optionValue);
        $(parent)
            .find('.options')
            .hide();
        
        let search = $('#search')
            .val()
            .toLowerCase()
        let allTasks = $('#task-table')
            .data('tasks')
        let tasks = allTasks
            .filter(({name})=>{
                return name.toLowerCase().includes(search)
            })
            .filter(({status}) => {
                return optionValue == 'all' || status == optionValue
            })
        $('#task-table')
            .empty();
        for (let task of tasks) {
            const tr = $(Dom.getTaskRow(task));
            $('#task-table')
                .append(tr);
        }
    });

    $(document).on('click', '#status-dropdown .option', async function(){
        const parent = $(this)
            .closest('.status-wrapper')
        const optionText = $(this)
            .text();
        const optionValue = $(this)
            .attr('data-value');
        $(parent)
            .find('.status-text')
            .text(optionText);
        $(parent)
            .find('.task-status')
            .attr('data-status', optionValue);
        $(parent)
            .find('.options')
            .hide();

        const res =  await updateTask()
        console.log(res);
    });

    $(document).on('click', '#back', async function(){
        await displayAllTasks();
    });

    $(document).on('click', function(e){
        if (
            !$(e.target).closest('.options').length && 
            !$(e.target).is('.task-status')
            ) {
            $('.options').hide();
        }

        if (
            !$(e.target).closest('.delete-wrapper').length && 
            !$(e.target).is('#more')
            ) {
            $('.delete-wrapper').hide();
        }
    });

    $(document).on('click', '#task-name', function(){
        $(this).attr('contenteditable', 'true').focus();
    });

    $(document).on('click', '#more', function(){
        $(this)
            .find('.delete-wrapper')
            .show();
    });

    $(document).on('click', '#more a', async function(){
        const taskId = $('#task-details')
            .data('id');
        const resPromise = await fetch(`${Dom.apiEndpoint}/tasks/${taskId}`,{
            method: 'DELETE',
        })
        const res = await resPromise.json()

        if(res.success){
            await displayAllTasks();
        }
    });

    $(document).on('input', '#search', function(){
        let search = $(this).val().toLowerCase()
        let allTasks = $('#task-table').data('tasks')
        let tasks = allTasks
            .filter(({name})=>{
                return name.toLowerCase().includes(search)
            })
        $('#task-table')
            .empty();
        for (let task of tasks) {
            const tr = $(Dom.getTaskRow(task));
            $('#task-table')
                .append(tr);
        }
    })

    $(document).on('focus', '#task-desc', function(){
        if($(this).hasClass('empty')){
            $(this).removeClass('empty')
            $(this).html('')
        }
    })

    $(document).on('blur', '#task-desc', function(){
        if(Dom.textLength($(this).html()) == 0){
            $(this)
                .html($(this)
                .attr('placeholder'))
            $(this)
                .addClass('empty')
        }
    })

    $(document).on('blur', '#task-name, #task-desc', async function(){
        const res =  await updateTask()
        console.log(res);
    })
});

async function displayAllTasks() {
    const tasksPromise = await fetch(`${Dom.apiEndpoint}/tasks`);
    const taskRes = await tasksPromise.json();

    if (!taskRes.success) {
        return;
    }

    if (taskRes.tasks.length !== 0) {
        $('#no-task').addClass('d-none');
    }

    $('#task-table')
        .data('tasks', taskRes.tasks)
    $('#task-table')
        .empty();
    for (let task of taskRes.tasks) {
        const tr = $(Dom.getTaskRow(task));
        $('#task-table')
            .append(tr);
    }
    Dom.displayList();
}

async function updateTask(){
    const taskId = $('#task-details')
        .data('id');
    const nameHtml = $('#task-name')
        .html()
    const name = Dom.textLength(nameHtml) ? 
            $('#task-name').html() : 
            'Task Title';

    const descHtml = $('#task-desc')
        .html()
    const desc = !$('#task-desc').hasClass('empty') ? 
        $('#task-desc').html() : 
        '';

    const status = $('#status-dropdown .task-status')
        .attr('data-status')
    
    const payload = {
        taskId,
        name,
        description: desc,
        status
    };

    const resPromise = await fetch(`${Dom.apiEndpoint}/tasks/${taskId}`,{
        method: 'PUT',
        body: JSON.stringify(payload),
        headers: {
            'Content-Type': 'application/json'
        }
    })

    const res = await resPromise.json()

    return res;
}