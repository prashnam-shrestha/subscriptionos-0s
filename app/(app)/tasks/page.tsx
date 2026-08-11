import { prisma } from "@/lib/db";
import TaskCard, { Task } from "./TaskCard";

export const revalidate = 0;

export default async function TasksPage({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  const { tab } = await searchParams;
  const currentTab = tab === "completed" ? "COMPLETED" : "PENDING";

  const tasksRaw = await prisma.task.findMany({
    where: { status: currentTab },
    orderBy: { createdAt: "desc" },
  });

  const tasks = tasksRaw.map(t => ({
    id: t.id,
    type: t.type as Task["type"],
    status: t.status as Task["status"],
    title: t.title,
    description: t.description,
    metadata: t.metadata,
    createdAt: t.createdAt,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Tasks Queue</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Manage operational actions and customer notifications.
        </p>
      </div>

      <div className="flex gap-4 border-b border-slate-200 dark:border-slate-800 pb-px">
        <a
          href="/tasks?tab=pending"
          className={`pb-2 text-sm font-semibold transition border-b-2 ${
            currentTab === "PENDING"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
        >
          Pending
        </a>
        <a
          href="/tasks?tab=completed"
          className={`pb-2 text-sm font-semibold transition border-b-2 ${
            currentTab === "COMPLETED"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
        >
          Completed
        </a>
      </div>

      {tasks.length === 0 ? (
        <div className="py-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No {currentTab.toLowerCase()} tasks found.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  );
}
