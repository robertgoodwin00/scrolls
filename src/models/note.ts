export interface Note {
    id?: string;
    title: string;
    author: string;
    content: string;
    hashtags?: string[];
    category: number;  // 0: General, 1: Sleight, 2: Trick, 3: Routine, 4: Act
    performing: string;
    props: string;
    setup: string;
    notes: string;
}