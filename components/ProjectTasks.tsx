

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { Task, TaskStatus, TaskPriority } from '../types';

const TASK_STATUSES: TaskStatus[] = ['todo', 'inprogress', 'done'];
const TASK_PRIORITIES: TaskPriority[] = ['low', 'medium', 'high'];

const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string; }> = {
  todo: { label: 'To Do', color: 'bg-slate-500' },
  inprogress: { label: 'In Progress', color: 'bg-blue-500' },
  done: { label: 'Done', color: 'bg-emerald-500' },
};

const PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string; }> = {
  low: { label: 'Low', color: 'bg-gray-500' },
  medium: { label: 'Medium', color: 'bg-yellow-600' },
  high: { label: 'High', color: 'bg-red-600' },
};

const TaskCard: React.FC<{
  task: Task;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Task>) => void;
}> = ({ task, onDelete, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task.title);
  const [editedPriority, setEditedPriority] = useState<TaskPriority>(task.priority || 'medium');
  const [editedDueDate, setEditedDueDate] = useState(task.dueDate || '');

  const handleStartEditing = () => {
      setEditedTitle(task.title);
      setEditedPriority(task.priority || 'medium');
      setEditedDueDate(task.dueDate || '');
      setIsEditing(true);
  }

  const handleSave = () => {
    if (editedTitle.trim()) {
      onUpdate(task.id, {
          title: editedTitle.trim(),
          priority: editedPriority,
          dueDate: editedDueDate || undefined,
      });
    }
    setIsEditing(false);
  };

  const formattedDueDate = useMemo(() => {
    if (!task.dueDate) return null;
    try {
      // Add a day to counteract timezone issues that can make the date appear as the day before
      const date = new Date(task.dueDate);
      const userTimezoneOffset = date.getTimezoneOffset() * 60000;
      return new Date(date.getTime() + userTimezoneOffset).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return null;
    }
  }, [task.dueDate]);

  return (
    <div className="bg-slate-800 p-3 rounded-lg shadow-md border border-slate-700">
      {isEditing ? (
        <div className="flex flex-col gap-3">
          <textarea
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSave())}
            className="w-full bg-slate-700 border border-slate-600 rounded-md py-1 px-2 text-slate-100 text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none"
            autoFocus
            rows={2}
          />
          <div className="flex items-center gap-2">
            <select
                value={editedPriority}
                onChange={(e) => setEditedPriority(e.target.value as TaskPriority)}
                className="flex-1 text-xs bg-slate-700 border border-slate-600 rounded-md py-1 px-2 text-slate-100 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            >
                {TASK_PRIORITIES.map(p => <option key={p} value={p}>{PRIORITY_CONFIG[p].label}</option>)}
            </select>
             <input
                type="date"
                value={editedDueDate}
                onChange={(e) => setEditedDueDate(e.target.value)}
                className="flex-1 text-xs bg-slate-700 border border-slate-600 rounded-md py-1 px-2 text-slate-100 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>
           <div className="flex justify-end gap-2">
                <button onClick={() => setIsEditing(false)} className="text-xs bg-slate-600 hover:bg-slate-500 text-white font-semibold py-1 px-2 rounded-md transition-colors">Cancel</button>
                <button onClick={handleSave} className="text-xs bg-blue-600 hover:bg-blue-500 text-white font-semibold py-1 px-2 rounded-md transition-colors">Save</button>
            </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
            <p className="text-slate-200 text-sm">{task.title}</p>
             {(task.priority || formattedDueDate) && (
                <div className="flex items-center justify-between text-xs">
                    {formattedDueDate ? (
                         <div className="flex items-center gap-1.5 text-slate-400">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            <span>{formattedDueDate}</span>
                        </div>
                    ) : <div />}
                    {task.priority && (
                         <span className={`px-2 py-0.5 rounded-full text-white font-semibold ${PRIORITY_CONFIG[task.priority].color}`}>
                            {PRIORITY_CONFIG[task.priority].label}
                        </span>
                    )}
                </div>
            )}
            <div className="flex justify-between items-center border-t border-slate-700 pt-2">
                 <select
                    value={task.status}
                    onChange={(e) => onUpdate(task.id, { status: e.target.value as TaskStatus })}
                    className="text-xs bg-slate-700 border border-slate-600 rounded-md py-1 px-2 text-slate-100 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                >
                    {TASK_STATUSES.map(status => (
                        <option key={status} value={status}>{STATUS_CONFIG[status].label}</option>
                    ))}
                </select>
                <div className="flex items-center gap-2">
                    <button onClick={handleStartEditing} aria-label="Edit task">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400 hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z" /></svg>
                    </button>
                     <button onClick={() => onDelete(task.id)} aria-label="Delete task">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400 hover:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

const TaskColumn: React.FC<{
  status: TaskStatus;
  tasks: Task[];
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Task>) => void;
}> = ({ status, tasks, ...props }) => {
  const { label, color } = STATUS_CONFIG[status];
  return (
    <div className="bg-slate-900/50 rounded-lg p-4 flex-1">
      <h3 className={`flex items-center gap-2 text-lg font-semibold text-white mb-4 pb-2 border-b-2 border-slate-700`}>
        <span className={`h-3 w-3 rounded-full ${color}`}></span>
        {label}
        <span className="text-sm font-normal text-slate-400 bg-slate-700 rounded-full px-2">{tasks.length}</span>
      </h3>
      <div className="space-y-3 h-full overflow-y-auto pr-2">
        {tasks.map(task => (
          <TaskCard key={task.id} task={task} {...props} />
        ))}
      </div>
    </div>
  );
};

const ProjectTasks: React.FC<{ projectId: string }> = ({ projectId }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const storageKey = useMemo(() => `parc-tasks-${projectId}`, [projectId]);

  useEffect(() => {
    try {
      const savedTasks = localStorage.getItem(storageKey);
      if (savedTasks) {
        setTasks(JSON.parse(savedTasks));
      } else {
        setTasks([]); // Ensure tasks are cleared when project changes
      }
    } catch (error) {
      console.error("Failed to load tasks from localStorage", error);
      setTasks([]);
    }
  }, [storageKey]);

  const saveTasks = useCallback((updatedTasks: Task[]) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(updatedTasks));
    } catch (error) {
      console.error("Failed to save tasks to localStorage", error);
    }
  }, [storageKey]);

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: newTaskTitle.trim(),
      status: 'todo',
      priority: 'medium', // Default priority
    };
    const updatedTasks = [...tasks, newTask];
    setTasks(updatedTasks);
    saveTasks(updatedTasks);
    setNewTaskTitle('');
  };

  const handleDeleteTask = (taskId: string) => {
    const updatedTasks = tasks.filter(t => t.id !== taskId);
    setTasks(updatedTasks);
    saveTasks(updatedTasks);
  };

  const handleUpdateTask = (taskId: string, updates: Partial<Task>) => {
    const updatedTasks = tasks.map(t => t.id === taskId ? { ...t, ...updates } : t);
    setTasks(updatedTasks);
    saveTasks(updatedTasks);
  };
  
  const tasksByStatus = useMemo(() => {
    const grouped: Record<TaskStatus, Task[]> = { todo: [], inprogress: [], done: [] };
    tasks.forEach(task => {
      grouped[task.status].push(task);
    });
    return grouped;
  }, [tasks]);

  return (
    <div className="space-y-6">
      <form onSubmit={handleAddTask} className="flex gap-4 items-center bg-slate-800 p-4 rounded-lg">
        <input
          type="text"
          value={newTaskTitle}
          onChange={e => setNewTaskTitle(e.target.value)}
          placeholder="Add a new task..."
          className="flex-1 bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300 disabled:bg-slate-600 disabled:cursor-not-allowed"
          disabled={!newTaskTitle.trim()}
        >
          Add Task
        </button>
      </form>
      <div className="flex gap-6 h-[50vh]">
        {TASK_STATUSES.map(status => (
          <TaskColumn
            key={status}
            status={status}
            tasks={tasksByStatus[status]}
            onDelete={handleDeleteTask}
            onUpdate={handleUpdateTask}
          />
        ))}
      </div>
    </div>
  );
};

export default ProjectTasks;