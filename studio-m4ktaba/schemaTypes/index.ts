import blockContent from './blockContent'
import category from './category'
import post from './post'
import user from './user'
import book from './book'
import order from './order.js'
import event_outbox from './system/event_outbox'
import dlq from './system/dlq'
import stripe_events from './system/stripe_events'
import sanity_perm_probe from './system/sanity_perm_probe'

export const schemaTypes = [
  post,
  user,
  category,
  book,
  blockContent,
  order,
  event_outbox,
  dlq,
  stripe_events,
  sanity_perm_probe,
]
