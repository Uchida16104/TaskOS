import { NextResponse } from 'next/server';
import { deleteTask, updateTask, type TaskStatus } from '@/lib/db';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const taskId = Number(id);
    if (!Number.isInteger(taskId)) {
      return NextResponse.json({ error: 'Invalid task id' }, { status: 400 });
    }

    const body = await request.json();
    const payload: {
      title?: string;
      details?: string;
      status?: TaskStatus;
      priority?: number;
      dueDate?: string | null;
    } = {};

    if (typeof body.title === 'string') payload.title = body.title;
    if (typeof body.details === 'string') payload.details = body.details;
    if (isTaskStatus(body.status)) payload.status = body.status;
    if (typeof body.priority === 'number') payload.priority = body.priority;
    if (Object.prototype.hasOwnProperty.call(body, 'dueDate')) {
      payload.dueDate = typeof body.dueDate === 'string' && body.dueDate ? body.dueDate : null;
    }

    const task = await updateTask(taskId, payload);
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json({ task });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const taskId = Number(id);
    if (!Number.isInteger(taskId)) {
      return NextResponse.json({ error: 'Invalid task id' }, { status: 400 });
    }

    const removed = await deleteTask(taskId);
    if (!removed) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

function isTaskStatus(value: unknown): value is TaskStatus {
  return value === 'todo' || value === 'doing' || value === 'done';
}
