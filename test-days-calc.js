const start = new Date('2025-10-27T23:30:00');
const end = new Date('2025-11-27T23:30:00');
const now = new Date('2025-10-29T09:25:00');
const daysLeft = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
console.log('Start:', start.toLocaleString());
console.log('End:', end.toLocaleString());
console.log('Now:', now.toLocaleString());
console.log('Days left:', daysLeft);
