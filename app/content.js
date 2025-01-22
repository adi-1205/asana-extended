const selectors = {
    sidebar: '.FullWidthPageStructureWithDetailsOverlay-detailsOverlay--visible',
    likeBtn: '.FullWidthPageStructureWithDetailsOverlay-detailsOverlay--visible .SubtleHeartButton.TaskPaneToolbar-button',
    taskView: '.FullWidthPageStructureWithDetailsOverlay-detailsOverlay--visible #TaskPrintView',
    navItems: '.SortableList-sortableItemContainer',
    taskName: '.FullWidthPageStructureWithDetailsOverlay-detailsOverlay--visible .SimpleTextarea ',
    taskRow: '.SpreadsheetTaskRow-nameOrDetailsCell',
    taskRowTextAreas: 'textarea',
    taskCard: '.BoardColumnWithSortableTasks-sortableItemWrapper--boardsRevamp',
    taskCardIdHolder: '.BoardCardLayout',
}

const MAX_RETRIES = 100;
const RETRY_INTERVAL = 100;

const apiEndpoint = 'http://localhost:3000'

class Utils {

    static sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    static waitUntil(condition, interval = 1000) {
        return new Promise((resolve, reject) => {

            // check every sometime and resolve
            const intervalId = setInterval(() => {
                if (condition()) {
                    clearInterval(intervalId);
                    resolve();
                }
            }, interval);

            // reject after max retries
            setTimeout(() => {
                clearInterval(intervalId);
                reject();
            }, MAX_RETRIES * interval);
        });
    }

    static pinButton() {
        const btn = document.createElement('button');
        const img = document.createElement('img');
        img.src = chrome.runtime.getURL('images/duck.png');

        img.id = 'asana-plus-button';
        img.width = 32;
        img.height = 32;
        btn.appendChild(img);
        return btn;
    }

    static pinExist() {
        return document.getElementById('asana-plus-button');
    }

    static insertBefore(newNode, referenceNode) {
        referenceNode.parentNode.insertBefore(newNode, referenceNode);
    }
}

document.addEventListener('pointerdown', async function (e) {
    await addPin(e);
});

(async () => {
    await addPin(null, true);

    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes glow {
        0% { filter: drop-shadow(0 0 5px rgba(255, 255, 255, 0.5)); }
        50% { filter: drop-shadow(0 0 20px rgba(255, 255, 0, 1)); }
        100% { filter: drop-shadow(0 0 5px rgba(255, 255, 255, 0.5)); }
      }
        
      @keyframes blink {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.4; }
      }

      .glow-effect {
        animation: glow 1s ease-in-out;
      }

      .blink-effect {
        animation: blink .3s ease-in-out 3;
      }
    `;

    document.head.appendChild(style);
})();

async function addPin(e, initCall = false) {
    try {
        let taskId = null;
        const taskRow = e?.target.closest(selectors.taskRow);
        const taskRowTextarea = taskRow?.querySelector(selectors.taskRowTextAreas)
        const taskCard = e?.target.closest(selectors.taskCard);
        const taskCardIdHolder = taskCard?.querySelector(selectors.taskCardIdHolder);


        if (taskRow && taskRowTextarea) {
            const taskDomId = taskRowTextarea?.id;
            taskId = taskDomId?.split('_').at(-1);
        }

        if (taskCard && taskCardIdHolder) {
            taskId = taskCardIdHolder?.dataset.taskId;
        }

        if (!taskId && !initCall) return;

        await sidebarRendered(taskId);

        if (Utils.pinExist()) return;

        const likeBtn = document.querySelector(selectors.likeBtn);
        if (!likeBtn) return;

        const btn = Utils.pinButton();
        Utils.insertBefore(btn, likeBtn);
    } catch (error) {
        console.error('Error rendering sidebar:', error);
    }
}

document.addEventListener('click', async function (e) {
    if (e.target.id === 'asana-plus-button') {
        const task = document.querySelector(selectors.taskView);
        const taskId = task.dataset.taskId;
        const taskName = document.querySelector(selectors.taskName).textContent;
        const taskUrl = window.location.href;

        const resPromise = await fetch(`${apiEndpoint}/tasks`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ taskId, name: taskName, url: taskUrl })
        });

        const res = await resPromise.json();

        console.log(res);
        
        if (res.success) {
            e.target.classList.add('glow-effect');
            setTimeout(() => {
                e.target.classList.remove('glow-effect');
            }, 1000);
        } else {
            e.target.classList.add('blink-effect');
            setTimeout(() => {
                e.target.classList.remove('blink-effect');
            }, 1000);
        }
    }
});

async function sidebarRendered(taskId) {
    try {
        await Utils.waitUntil(() => {
            return taskId ?
                document.querySelector(selectors.taskView).dataset.taskId == taskId :
                document.querySelector(selectors.taskView);
        }, RETRY_INTERVAL)
        return Promise.resolve();
    } catch (err) {
        return Promise.reject(err);
    }
}


