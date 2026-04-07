import { Inngest } from 'inngest'

export const inngest = new Inngest({
  id: 'chiqueteza',
  eventKey: process.env.INNGEST_EVENT_KEY,
})
