import { AppError } from '../app-errors.js'

export function objectsCreated (collectionName, objects) {
  return _createObjectsEvent('created', collectionName, objects)
}

export function objectsLoaded (collectionName, objects) {
  return _createObjectsEvent('loaded', collectionName, objects)
}

function _createObjectsEvent (operationType, collectionName, objects) {
  if (!operationType) {
    throw new EventArgumentError()
  }
  if (typeof operationType !== 'string') {
    throw new EventArgumentError()
  }
  if (!collectionName) {
    throw new EventArgumentError()
  }
  if (typeof collectionName !== 'string') {
    throw new EventArgumentError()
  }
  if (!Array.isArray(objects)) {
    throw new EventArgumentError()
  }
  if (objects.some(o => !o)) {
    throw new EventArgumentError()
  }

  return {
    type: `objects-${operationType}`,
    namedType: `${collectionName}-${operationType}`,
    collectionName,
    objects
  }
}

export class EventArgumentError extends AppError {
  constructor (context, inner) {
    super('Invalid event argument.', context, inner)

    Object.setPrototypeOf(this, EventArgumentError.prototype)
  }
}
