import { google } from "googleapis";

// Use dedicated OAuth 2.0 credentials for Tasks (personal account)
const oauthClientId = process.env.GOOGLE_CALENDAR_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
const oauthClientSecret = process.env.GOOGLE_CALENDAR_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;
const oauthRefreshToken = process.env.GOOGLE_CALENDAR_REFRESH_TOKEN || process.env.GOOGLE_REFRESH_TOKEN;

const scopes = [
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/tasks.readonly"
];

// Tasks always uses OAuth 2.0 for personal account access
if (!oauthClientId || !oauthClientSecret || !oauthRefreshToken) {
  throw new Error(
    "Google Tasks authentication not configured. Please set:" +
    "\nGOOGLE_CALENDAR_CLIENT_ID, GOOGLE_CALENDAR_CLIENT_SECRET, GOOGLE_CALENDAR_REFRESH_TOKEN" +
    "\n(or fall back to GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN)"
  );
}

console.log("Using OAuth 2.0 authentication for Google Tasks");
const oauth2Client = new google.auth.OAuth2(
  oauthClientId,
  oauthClientSecret,
  "http://localhost:3000/oauth2callback"
);
oauth2Client.setCredentials({
  refresh_token: oauthRefreshToken,
});

const auth = oauth2Client;

const tasks = google.tasks({
  version: "v1",
  auth,
});

/**
 * List all task lists
 */
export async function listTaskLists() {
  try {
    const response = await tasks.tasklists.list({
      maxResults: 100,
    });

    return response.data.items || [];
  } catch (error: any) {
    console.error("Error fetching task lists:", error.message);
    throw new Error(`Failed to fetch task lists: ${error.message}`);
  }
}

/**
 * List tasks from a specific task list
 */
export async function listTasks(
  taskListId: string,
  maxResults: number = 100,
  showCompleted: boolean = true,
  showHidden: boolean = false
) {
  try {
    const requestParams: any = {
      tasklist: taskListId,
      maxResults,
      showCompleted,
      showHidden,
    };

    const response = await tasks.tasks.list(requestParams);

    return response.data.items || [];
  } catch (error: any) {
    console.error("Error fetching tasks:", error.message);
    throw new Error(`Failed to fetch tasks: ${error.message}`);
  }
}

/**
 * List all tasks from all task lists
 */
export async function listAllTasks(
  maxResults: number = 100,
  showCompleted: boolean = true,
  showHidden: boolean = false
) {
  try {
    const taskLists = await listTaskLists();
    const allTasks = [];

    for (const taskList of taskLists) {
      if (taskList.id) {
        const taskListTasks = await listTasks(
          taskList.id,
          maxResults,
          showCompleted,
          showHidden
        );
        
        // Add task list information to each task
        const tasksWithListInfo = taskListTasks.map((task) => ({
          ...task,
          taskListId: taskList.id,
          taskListName: taskList.title,
        }));
        
        allTasks.push(...tasksWithListInfo);
      }
    }

    return allTasks;
  } catch (error: any) {
    console.error("Error fetching all tasks:", error.message);
    throw new Error(`Failed to fetch all tasks: ${error.message}`);
  }
}

/**
 * Get a specific task
 */
export async function getTask(taskListId: string, taskId: string) {
  try {
    const response = await tasks.tasks.get({
      tasklist: taskListId,
      task: taskId,
    });

    return response.data;
  } catch (error: any) {
    console.error("Error fetching task:", error.message);
    throw new Error(`Failed to fetch task: ${error.message}`);
  }
}

/**
 * Create a new task
 */
export async function createTask(
  taskListId: string,
  title: string,
  notes?: string,
  due?: Date,
  parent?: string
) {
  try {
    const response = await tasks.tasks.insert({
      tasklist: taskListId,
      requestBody: {
        title,
        notes,
        due: due?.toISOString(),
        parent,
      },
    });

    return response.data;
  } catch (error: any) {
    console.error("Error creating task:", error.message);
    throw new Error(`Failed to create task: ${error.message}`);
  }
}

/**
 * Update a task
 */
export async function updateTask(
  taskListId: string,
  taskId: string,
  updates: {
    title?: string;
    notes?: string;
    status?: string;
    due?: Date;
    completed?: Date;
  }
) {
  try {
    const response = await tasks.tasks.update({
      tasklist: taskListId,
      task: taskId,
      requestBody: {
        title: updates.title,
        notes: updates.notes,
        status: updates.status,
        due: updates.due?.toISOString(),
        completed: updates.completed?.toISOString(),
      },
    });

    return response.data;
  } catch (error: any) {
    console.error("Error updating task:", error.message);
    throw new Error(`Failed to update task: ${error.message}`);
  }
}

/**
 * Delete a task
 */
export async function deleteTask(taskListId: string, taskId: string) {
  try {
    await tasks.tasks.delete({
      tasklist: taskListId,
      task: taskId,
    });

    return { success: true };
  } catch (error: any) {
    console.error("Error deleting task:", error.message);
    throw new Error(`Failed to delete task: ${error.message}`);
  }
}

/**
 * Mark a task as completed
 */
export async function completeTask(taskListId: string, taskId: string) {
  try {
    const response = await tasks.tasks.update({
      tasklist: taskListId,
      task: taskId,
      requestBody: {
        status: "completed",
        completed: new Date().toISOString(),
      },
    });

    return response.data;
  } catch (error: any) {
    console.error("Error completing task:", error.message);
    throw new Error(`Failed to complete task: ${error.message}`);
  }
}

/**
 * Clear completed tasks from a task list
 */
export async function clearCompletedTasks(taskListId: string) {
  try {
    await tasks.tasks.clear({
      tasklist: taskListId,
    });

    return { success: true };
  } catch (error: any) {
    console.error("Error clearing completed tasks:", error.message);
    throw new Error(`Failed to clear completed tasks: ${error.message}`);
  }
}
