/**
 * Custom Vuelidate Validators
 *
 * See Builtin Validators: https://monterail.github.io/vuelidate/#sub-builtin-validators
 *
 * Vuelidate version 0.7.3 functions that do not handle Promises:
 *
 *  - and
 *  - or
 *  - not
 *
**/
import store from '@/store'
import { parse, format, isValid, compareAsc } from 'date-fns'

const _common = require('vuelidate/lib/validators/common')

/**
 *
 * Misc local helpers
 *
**/

// Get the unique id of a given $v.
const idOfV = ($v) => {
  if ($v && typeof $v !== 'string' && '__ob__' in $v && 'dep' in $v.__ob__ && 'id' in $v.__ob__.dep) {
    return $v.__ob__.dep.id
  }
  return undefined
}

/**
 *  Get the parent $v of a given id.
 *
 *  For use with "Field" functions.
 *  Searches for a member from a given |id|,
 *   starts with the base $v, and traverses the entire $v model tree recursively,
 *   returns the members' parent.
**/
const parentVofId = ($v, id) => {
  const params = Object.keys($v.$params)
  for (let i = 0; i < params.length; i++) {
    let param = params[i]
    if (typeof $v[param] === 'object' && typeof $v[param].$model === 'object') {
      if ($v[param].$model && '__ob__' in $v[param].$model) {
        if (idOfV($v[param].$model) === id) return $v
      }
      // recurse
      let $parent = parentVofId($v[param], id)
      if ($parent) return $parent
    }
  }
  return undefined
}

// Get the id, parent and params from a given $v member
const idParentParamsFromV = (vBase, vMember) => {
  const id = idOfV(vMember)
  const parent = (id) ? parentVofId(vBase, id) : undefined
  const params = (id) ? Object.entries(parent.$params) : undefined
  return { id: id, parent: parent, params: params }
}

/**
 * Default replacements - Fix Promises
**/

// Default vuelidate |and| replacement, handles Promises
export const and = (...validators) => {
  return _common.withParams({ type: 'and' }, function (...args) {
    return (
      validators.length > 0 &&
      Promise.all(validators.map(fn => fn.apply(this, args))).then(values => {
        return values.reduce((valid, value) => {
          return valid && value
        }, true)
      })
    )
  })
}

// Default vuelidate |or| replacement, handles Promises
export const or = (...validators) => {
  return _common.withParams({ type: 'and' }, function (...args) {
    return (
      validators.length > 0 &&
      Promise.all(validators.map(fn => fn.apply(this, args))).then(values => {
        return values.reduce((valid, value) => {
          return valid || value
        }, false)
      })
    )
  })
}

// Default vuelidate |not| replacement, handles Promises
export const not = (validator) => {
  return _common.withParams({ type: 'not' }, function (value, vm) {
    let newValue = validator.call(this, value, vm)
    if (Promise.resolve(newValue) === newValue) { // is it a Promise?
      // wait for promise to resolve before inverting it
      return newValue.then((value) => !value)
    }
    return !newValue
  })
}

/**
 *
 * Custom functions
 *
**/

export const conditional = (conditional) => {
  return (0, _common.withParams)({
    type: 'conditional',
    conditional: conditional
  }, function () {
    return conditional
  })
}

export const inArray = (array) => {
  return (0, _common.withParams)({
    type: 'inArray',
    array: array
  }, function (value) {
    return !(0, _common.req)(value) || array.includes(value)
  })
}

export const isDateFormat = (dateFormat, allowZero = true) => {
  return (0, _common.withParams)({
    type: 'isDateFormat',
    dateFormat: dateFormat,
    allowZero: allowZero
  }, function (value) {
    return !(0, _common.req)(value) || format(parse(value), dateFormat) === value || (dateFormat.replace(/[a-z]/gi, '0') === value && allowZero)
  })
}

export const isFQDN = (value) => {
  if (!value) return true
  const parts = value.split('.')
  const tld = parts.pop()
  if (!parts.length || !/^([a-z\u00a1-\uffff]{2,}|xn[a-z0-9-]{2,})$/i.test(tld)) {
    return false
  }
  for (let i = 0; i < parts.length; i++) {
    let part = parts[i]
    if (part.indexOf('__') >= 0) {
      return false
    }
    if (!/^[a-z\u00a1-\uffff0-9-_]+$/i.test(part)) {
      return false
    }
    if (/[\uff01-\uff5e]/.test(part)) {
      // disallow full-width chars
      return false
    }
    if (part[0] === '-' || part[part.length - 1] === '-') {
      return false
    }
  }
  return true
}

export const isPort = (value) => {
  if (!value) return true
  return ~~value >= 1 && ~~value <= 65535
}

export const compareDate = (comparison, date = new Date(), dateFormat = 'YYYY-MM-DD HH:mm:ss', allowZero = true) => {
  return (0, _common.withParams)({
    type: 'compareDate',
    comparison: comparison,
    date: date,
    dateFormat: dateFormat,
    allowZero: allowZero
  }, function (value) {
    // ignore empty or zero'd (0000-00-00...)
    if (!value || (value === dateFormat.replace(/[a-z]/gi, '0') && allowZero)) return true
    // round date/value using dateFormat
    date = parse(format((date instanceof Date && isValid(date) ? date : parse(date)), dateFormat))
    value = parse(format((value instanceof Date && isValid(value) ? value : parse(value)), dateFormat))
    // compare
    const cmp = compareAsc(value, date)
    switch (comparison.toLowerCase()) {
      case '>': case 'gt': return (cmp > 0)
      case '>=': case 'gte': return (cmp >= 0)
      case '<': case 'lt': return (cmp < 0)
      case '<=': case 'lte': return (cmp <= 0)
      case '===': case 'eq': return (cmp === 0)
      case '!==': case 'ne': return (cmp !== 0)
      default: return false
    }
  })
}

export const categoryIdNumberExists = (value, component) => {
  if (!value || !/^\d+$/.test(value)) return true
  return store.dispatch('config/getRoles').then((response) => {
    return (response.filter(role => role.category_id === value).length > 0)
  }).catch(() => {
    return true
  })
}

export const categoryIdStringExists = (value, component) => {
  if (!value || /^\d+$/.test(value)) return true
  return store.dispatch('config/getRoles').then((response) => {
    return (response.filter(role => role.name.toLowerCase() === value.toLowerCase()).length > 0)
  }).catch(() => {
    return true
  })
}

export const sourceExists = (value, component) => {
  if (!value) return true
  return store.dispatch('config/getSources').then((response) => {
    return (response.filter(source => source.id.toLowerCase() === value.toLowerCase()).length > 0)
  }).catch(() => {
    return true
  })
}

export const nodeExists = (value, component) => {
  if (!value || value.length !== 17) return true
  return store.dispatch('$_nodes/exists', value).then(() => {
    return false
  }).catch(() => {
    return true
  })
}

export const userExists = (value, component) => {
  if (!value) return true
  return store.dispatch('$_users/exists', value).then(results => {
    return true
  }).catch(() => {
    return false
  })
}

export const userNotExists = (value, component) => {
  if (!value) return true
  return store.dispatch('$_users/exists', value).then(results => {
    return false
  }).catch(() => {
    return true
  })
}

/**
 * Field functions
 *
 * For use with pfFormSortableField component.
 * Used to validate |type| fields with immediate siblings.
 * All functions ignore self.
**/

// Limit the count of sibling field |type|s
export const limitSiblingFieldTypes = (limit) => {
  return (0, _common.withParams)({
    type: 'limitSiblingFieldTypes',
    limit: limit
  }, function (value, field) {
    let count = 0
    const { id, parent, params } = idParentParamsFromV(this.$v, field)
    if (params) {
      // iterate through all params
      for (let i = 0; i < params.length; i++) {
        const [param] = params[i] // destructure
        if (parent[param].$model === undefined) continue // ignore empty models
        if (idOfV(parent[param].$model) === id) continue // ignore (self)
        if (parent[param].$model.type === field.type) {
          count += 1 // increment count
          if (count > limit) return false
        }
      }
    }
    return true
  })
}

// Require all of sibling field |type|s
export const requireAllSiblingFieldTypes = (...fieldTypes) => {
  return (0, _common.withParams)({
    type: 'requireAllSiblingFieldTypes',
    fieldTypes: fieldTypes
  }, function (value, field) {
    // dereference, preserve original
    let _fieldTypes = JSON.parse(JSON.stringify(fieldTypes))
    const { id, parent, params } = idParentParamsFromV(this.$v, field)
    if (params) {
      // iterate through all params
      for (let i = 0; i < params.length; i++) {
        const [param] = params[i] // destructure
        if (parent[param].$model === undefined) continue // ignore empty models
        if (idOfV(parent[param].$model) === id) continue // ignore (self)
        // iterate through _fieldTypes and substitute
        _fieldTypes = _fieldTypes.map(fieldType => {
          // substitute the fieldType with |true| if it exists
          return (parent[param].$model.type === fieldType) ? true : fieldType
        })
      }
    }
    // return |true| if all members of the the array are |true|,
    // anything else return false
    return _fieldTypes.reduce((bool, fieldType) => { return bool && (fieldType === true) }, true)
  })
}

// Require any of sibling field |type|s
export const requireAnySiblingFieldTypes = (...fieldTypes) => {
  return (0, _common.withParams)({
    type: 'requireAnySiblingFieldTypes',
    fieldTypes: fieldTypes
  }, function (value, field) {
    // dereference, preserve original
    let _fieldTypes = JSON.parse(JSON.stringify(fieldTypes))
    const { id, parent, params } = idParentParamsFromV(this.$v, field)
    if (params) {
      // iterate through all params
      for (let i = 0; i < params.length; i++) {
        const [param] = params[i] // destructure
        if (parent[param].$model === undefined) continue // ignore empty models
        if (idOfV(parent[param].$model) === id) continue // ignore (self)
        // return |true| if any fieldType exists
        if (_fieldTypes.includes(parent[param].$model.type)) return true
      }
    }
    // otherwise return false
    return false
  })
}

// Restrict all of sibling field |type|s
export const restrictAllSiblingFieldTypes = (...fieldTypes) => {
  return (0, _common.withParams)({
    type: 'restrictAllSiblingFieldTypes',
    fieldTypes: fieldTypes
  }, function (value, field) {
    // dereference, preserve original
    let _fieldTypes = JSON.parse(JSON.stringify(fieldTypes))
    const { id, parent, params } = idParentParamsFromV(this.$v, field)
    if (params) {
      // iterate through all params
      for (let i = 0; i < params.length; i++) {
        const [param] = params[i] // destructure
        if (parent[param].$model === undefined) continue // ignore empty models
        if (idOfV(parent[param].$model) === id) continue // ignore (self)
        // iterate through _fieldTypes and substitute
        _fieldTypes = _fieldTypes.map(fieldType => {
          // substitute the fieldType with |true| if it exists
          return (parent[param].$model.type === fieldType) ? true : fieldType
        })
      }
    }
    // return |false| if all members of the the array are |true|,
    // anything else return true
    return !_fieldTypes.reduce((bool, fieldType) => { return bool && (fieldType === true) }, true)
  })
}

// Restrict any of sibling field |type|s
export const restrictAnySiblingFieldTypes = (...fieldTypes) => {
  return (0, _common.withParams)({
    type: 'restrictAnySiblingFieldTypes',
    fieldTypes: fieldTypes
  }, function (value, field) {
    // dereference, preserve original
    let _fieldTypes = JSON.parse(JSON.stringify(fieldTypes))
    const { id, parent, params } = idParentParamsFromV(this.$v, field)
    if (params) {
      // iterate through all params
      for (let i = 0; i < params.length; i++) {
        const [param] = params[i] // destructure
        if (parent[param].$model === undefined) continue // ignore empty models
        if (idOfV(parent[param].$model) === id) continue // ignore (self)
        // return |false| if any fieldType exists
        if (_fieldTypes.includes(parent[param].$model.type)) return false
      }
    }
    // otherwise return true
    return true
  })
}
