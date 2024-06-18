export interface ISubscription extends Document {
    ownerId: string;
    state: string;
    type: string;
    activeState: boolean;
    createdAt: Date;
    description: string;

    userId: string;
    plan: string;
    status: 'active' | 'inactive' | 'canceled';
    startDate: Date;
    endDate: Date;
    trial: boolean;
}