import { NextResponse } from 'next/server';
import { deleteTask, updateTask, type TaskStatus } from '@/lib/db';

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(
  request: Request,
  { params }: RouteContext
) {
  try {
    const { id } = await params;

    const taskId = Number(id);

    if (!Number.isInteger(taskId)) {
      return NextResponse.json(
        { error: 'Invalid task id' },
        { status: 400 }
      );
    }

    const body = await request.json();

    const payload: {
      title?: string;
      details?: string;
      status?: TaskStatus;
      priority?: number;
      dueDate?: string | null;
    } = {};

    if (typeof body.title === 'string')
      payload.title = body.title;

    if (typeof body.details === 'string')
      payload.details = body.details;

    if (isTaskStatus(body.status))
      payload.status = body.status;

    if (typeof body.priority === 'number')
      payload.priority = body.priority;

    if (Object.prototype.hasOwnProperty.call(body, 'dueDate')) {
      payload.dueDate =
        typeof body.dueDate === 'string' && body.dueDate
          ? body.dueDate
          : null;
    }

    const task = await updateTask(taskId, payload);

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ task });

  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Unknown error'
      },
      {
        status: 400
      }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: RouteContext
) {
  try {
    const { id } = await params;

    const taskId = Number(id);

    if (!Number.isInteger(taskId)) {
      return NextResponse.json(
        { error: 'Invalid task id' },
        { status: 400 }
      );
    }

    const removed = await deleteTask(taskId);

    if (!removed) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true });

  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Unknown error'
      },
      {
        status: 400
      }
    );
  }
}

function isTaskStatus(value: unknown): value is TaskStatus {
  return (
    value === 'todo' ||
    value === 'doing' ||
    value === 'done'
  );
}
