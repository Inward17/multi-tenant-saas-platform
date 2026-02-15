declare enum TaskStatus {
    TODO = "TODO",
    IN_PROGRESS = "IN_PROGRESS",
    DONE = "DONE"
}
export declare class CreateTaskDto {
    title: string;
    description?: string;
    status?: TaskStatus;
    projectId: string;
    assignedTo?: string;
}
export {};
