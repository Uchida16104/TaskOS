import { NextResponse } from 'next/server';
import { createTask, listTasks, type TaskStatus } from '@/lib/db';

export async function GET() {
  try {
    const tasks = await listTasks();
    return NextResponse.json({ tasks });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const title = typeof body.title === 'string' ? body.title : '';
    const details = typeof body.details === 'string' ? body.details : undefined;
    const status = isTaskStatus(body.status) ? body.status : undefined;
    const priority = typeof body.priority === 'number' ? body.priority : undefined;
    const dueDate = typeof body.dueDate === 'string' && body.dueDate.trim() ? body.dueDate : null;

    const task = await createTask({ title, details, status, priority, dueDate });
    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

function isTaskStatus(value: unknown): value is TaskStatus {
  return value === 'todo' || value === 'doing' || value === 'done';
}
