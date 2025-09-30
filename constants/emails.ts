export type Email = {
  id: number;
  category: string;
  sender: string;
  subject?: string | undefined;
  description: string;
};

const emails: Email[] = [
  {
    id: 1,
    category: "primary",
    sender: "Jane Doe",
    subject: "Tickets for tonight",
    description:
      "Hey! Attaching your tickets here in case we end up going at different times.",
  },
  {
    id: 2,
    category: "hotel",
    sender: "Poshmark",
    description: "You have great taste!",
  },
  {
    id: 3,
    category: "hotel",
    sender: "Uber",
    description: "Make your commute even easier.",
  },
  {
    id: 4,
    category: "hotel",
    sender: "Disney+",
    description: "Bingeable series for every mood.",
  },
  {
    id: 5,
    category: "train",
    sender: "United Airlines",
    subject: "Quick reminders about your flight",
    description: "Here is a checklist before your flight.",
  },
  {
    id: 6,
    category: "airplane",
    sender: "Nike",
    subject: "Order confirmation",
    description: "Your shoe order is confirmed.",
  },
  {
    id: 7,
    category: "primary",
    sender: "John Smith",
    subject: "Meeting reschedule",
    description:
      "Can we push our meeting to 3 PM instead? Let me know if that works for you.",
  },
  {
    id: 8,
    category: "primary",
    sender: "Mom",
    subject: "Weekend plans",
    description: "Are you free for dinner this weekend? Let me know!",
  },
  {
    id: 9,
    category: "airplane",
    sender: "Amazon",
    subject: "Your order has shipped",
    description: "Your package is on its way. Track your order here.",
  },
  {
    id: 10,
    category: "airplane",
    sender: "Starbucks",
    subject: "Receipt for your recent purchase",
    description: "Thanks for stopping by! Your receipt is attached.",
  },
  {
    id: 11,
    category: "train",
    sender: "LinkedIn",
    subject: "New connection request",
    description: "You have a new connection request from Sarah.",
  },
  {
    id: 12,
    category: "train",
    sender: "Slack",
    subject: "Workspace downtime notice",
    description: "We'll be performing maintenance tonight at 11 PM PST.",
  },
  {
    id: 13,
    category: "hotel",
    sender: "Apple Music",
    description: "Discover your next favorite artist.",
  },
  {
    id: 14,
    category: "hotel",
    sender: "Wayfair",
    description: "Home essentials up to 50% off.",
  },
];

export const getAllEmails = () => {
  return emails;
};
