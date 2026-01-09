export interface AnnouncementType {
    value: string;
    label: string;
    color: string;
}

export interface VisibilityOption {
    value: string;
    label: string;
}

export interface AnnouncementFormData {
    title: string;
    message: string;
    type: string;
    visibleTo: string;
    competitionId: string;
}
