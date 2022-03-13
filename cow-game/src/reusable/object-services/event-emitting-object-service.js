import { AppError } from '../app-errors.js'
import { objectsLoaded, objectsCreated } from './object-service-events.js'

/**
 * Feathers-shaped object service proxies and emits events on operations to an underlying object service.
 *
 * See: https://docs.feathersjs.com/api/services.html#service-methods
 */
export class EventEmittingObjectService {
  constructor (proxiedObjectService, collectionName, onEventEmitted) {
    if (!proxiedObjectService) {
      throw new AppError()
    }
    if (!collectionName) {
      throw new AppError()
    }
    if (!onEventEmitted) {
      throw new AppError()
    }
    if (typeof onEventEmitted !== 'function') {
      throw new AppError()
    }

    this._proxiedObjectService = proxiedObjectService
    this._collectionName = collectionName
    this._onEventEmitted = onEventEmitted
  }

  async find (...p) {
    const result = await this._proxiedObjectService.find(...p)
    this._onEventEmitted(objectsLoaded(this._collectionName, result))
  }

  async get (...p) {
    const result = await this._proxiedObjectService.get(...p)
    this._onEventEmitted(objectsLoaded(this._collectionName, [result]))
  }

  async create (data, ...p) {
    await this._proxiedObjectService.create(data, ...p)
    this._onEventEmitted(objectsCreated(this._collectionName, [data]))
  }

  async update (id, data, params) {
    throw new AppError('Not implemented.')
  }

  async patch (id, data, params) {
    throw new AppError('Not implemented.')
  }

  async remove (id, params) {
    throw new AppError('Not implemented.')
  }
}
