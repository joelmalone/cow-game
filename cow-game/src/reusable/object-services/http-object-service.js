import { AppError } from '../app-errors.js'

/**
 * Feathers-shaped object service that integrates with a remote REST interface:
 *
 * See: https://docs.feathersjs.com/api/services.html#service-methods
 */
export class HttpObjectService {
  constructor (baseUrl) {
    if (!baseUrl) {
      throw new AppError()
    }
    if (typeof baseUrl !== 'string') {
      throw new AppError()
    }

    this._baseUrl = baseUrl
  }

  async find (params) {
    const url = this._getUrl(null, params)
    const response = await fetch(url)
      .catch(err => { throw new AppError('Fetch GET threw an error.', { url, params }, err) })

    if (response.ok) {
      return await response.json()
    } else {
      throw new AppError('Response was not OK.', { status: response.status, params })
    }
  }

  async get (id, params) {
    const url = this._getUrl(id, params)
    const response = await fetch(url)
      .catch(err => { throw new AppError('Fetch GET threw an error.', { url, params }, err) })

    if (response.ok) {
      return await response.json()
    } else {
      throw new AppError('Response was not OK.', { status: response.status, id, params })
    }
  }

  async create (data, params) {
    const url = this._getUrl(null, params)
    const response = await fetch(
      url,
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })
      .catch(err => { throw new AppError('Fetch POST threw an error.', { url, data, params }, err) })

    if (response.ok) {
      return await response.json()
    } else {
      throw new AppError('Response was not OK.', { status: response.status, url, data, params })
    }
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

  _getUrl (idOrEmpty, queryObjectOrEmpty) {
    const idSegment = idOrEmpty ? ('/' + encodeURIComponent(idOrEmpty)) : ''
    const query = queryObjectOrEmpty
      ? new URLSearchParams(queryObjectOrEmpty).toString()
      : ''

    return this._baseUrl + idSegment + query
  }
}
