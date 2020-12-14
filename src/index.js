import 'babel-polyfill'
import Koa from 'koa'
import Router from 'koa-router'
import mysql from 'mysql2/promise'
import KoaBody from 'koa-bodyparser'
import Url from 'url'

// The port that this server will run on, defaults to 9000
const port = process.env.PORT || 9000

// Instantiate a Koa server
const app = new Koa()
const koaBody = new KoaBody()

// Instantiate routers
const customers = new Router()
const orders = new Router()
const delivered = new Router()

// Define API path
const apiPath = '/api/v1'

const connectionSettings = {
  host: 'db',
  user: 'root',
  database: 'db_1',
  password: 'db_rootpass',
  namedPlaceholders: true,
}

// Middleware for checking accept headers
const checkAccept = async (ctx, next) => {
  console.log('checkAccept')
  // If client does not accept 'application/json' as response type, throw '406 Not Acceptable'
  if (!ctx.accepts('application/json')) {
    ctx.throw(406)
  }
  // Set the response content type
  ctx.type = 'application/json; charset=utf-8'
  // Move to next middleware
  await next()
}

// Middleware for checking request body content
const checkContent = async (ctx, next) => {
  console.log('checkContent')
  // Check that the request content type is 'application/json'
  if (!ctx.is('application/json')) {
    ctx.throw(415, 'Request must be application/json')
  }
  // Move to next middleware
  await next()
}

// Define Paths and resource id
const customersPath = `${apiPath}/customers`
const customerPath = `${customersPath}/:id`

const ordersPath = `${apiPath}/orders`
const orderPath = `${ordersPath}/:id`

const deliveredPath = `${apiPath}/delivered`
const deliveryPath = `${deliveredPath}/:id`

customers.get(customersPath, checkAccept, async (ctx) => {
  const url = Url.parse(ctx.url, true)
  const { sort } = url.query

  const parseSortQuery = ({ urlSortQuery, whitelist }) => {
    let query = ''
    if (urlSortQuery) {
      const sortParams = urlSortQuery.split(',')

      query = 'ORDER BY '
      sortParams.forEach((param, index) => {
        let trimmedParam = param
        let desc = false

        if (param[0] === '-') {
          // Remove the first character
          trimmedParam = param.slice(1)
          // Set descending to true
          desc = true
        }

        // If parameter is not whitelisted, ignore it
        // This also prevents SQL injection even without statement preparation
        if (!whitelist.includes(trimmedParam)) return

        // If this is not the first sort parameter, append ', '
        if (index > 0) query = query.concat(', ')

        // Append the name of the field
        query = query.concat(trimmedParam)

        if (desc) query = query.concat(' DESC')
      })
    }
    return query
  }
  const orderBy = parseSortQuery({
    urlSortQuery: sort,
    whitelist: ['customer_id', 'customer_name'],
  })

  try {
    const conn = await mysql.createConnection(connectionSettings)
    const [data] = await conn.execute(`
        SELECT *
        FROM customers
        ${orderBy}
      `)

    // Return all todos
    ctx.body = data
  } catch (error) {
    console.error('Error occurred:', error)
    ctx.throw(500, error)
  }
})

orders.get(ordersPath, checkAccept, async (ctx) => {
  const url = Url.parse(ctx.url, true)
  const { sort } = url.query

  const parseSortQuery = ({ urlSortQuery, whitelist }) => {
    let query = ''
    if (urlSortQuery) {
      const sortParams = urlSortQuery.split(',')

      query = 'ORDER BY '
      sortParams.forEach((param, index) => {
        let trimmedParam = param
        let desc = false

        if (param[0] === '-') {
          // Remove the first character
          trimmedParam = param.slice(1)
          // Set descending to true
          desc = true
        }

        // If parameter is not whitelisted, ignore it
        // This also prevents SQL injection even without statement preparation
        if (!whitelist.includes(trimmedParam)) return

        // If this is not the first sort parameter, append ', '
        if (index > 0) query = query.concat(', ')

        // Append the name of the field
        query = query.concat(trimmedParam)

        if (desc) query = query.concat(' DESC')
      })
    }
    return query
  }
  const orderBy = parseSortQuery({
    urlSortQuery: sort,
    whitelist: ['order_id', 'customer_id', 'amount'],
  })

  try {
    const conn = await mysql.createConnection(connectionSettings)
    const [data] = await conn.execute(`
        SELECT *
        FROM orders
        ${orderBy}
      `)

    // Return all todos
    ctx.body = data
  } catch (error) {
    console.error('Error occurred:', error)
    ctx.throw(500, error)
  }
})

delivered.get(deliveredPath, checkAccept, async (ctx) => {
  const url = Url.parse(ctx.url, true)
  const { sort } = url.query

  const parseSortQuery = ({ urlSortQuery, whitelist }) => {
    let query = ''
    if (urlSortQuery) {
      const sortParams = urlSortQuery.split(',')

      query = 'ORDER BY '
      sortParams.forEach((param, index) => {
        let trimmedParam = param
        let desc = false

        if (param[0] === '-') {
          // Remove the first character
          trimmedParam = param.slice(1)
          // Set descending to true
          desc = true
        }

        // If parameter is not whitelisted, ignore it
        // This also prevents SQL injection even without statement preparation
        if (!whitelist.includes(trimmedParam)) return

        // If this is not the first sort parameter, append ', '
        if (index > 0) query = query.concat(', ')

        // Append the name of the field
        query = query.concat(trimmedParam)

        if (desc) query = query.concat(' DESC')
      })
    }
    return query
  }
  const orderBy = parseSortQuery({
    urlSortQuery: sort,
    whitelist: ['delivery_id', 'order_id', 'delivery_done'],
  })

  try {
    const conn = await mysql.createConnection(connectionSettings)
    const [data] = await conn.execute(`
        SELECT *
        FROM delivered
        ${orderBy}
      `)

    // Return all todos
    ctx.body = data
  } catch (error) {
    console.error('Error occurred:', error)
    ctx.throw(500, error)
  }
})

customers.get(customerPath, checkAccept, async (ctx) => {
  const { id } = ctx.params
  console.log('.get id contains:', id)

  if (isNaN(id) || id.includes('.')) {
    ctx.throw(400, 'id must be an integer')
  }

  try {
    const conn = await mysql.createConnection(connectionSettings)
    const [data] = await conn.execute(
      `
          SELECT *
          FROM customers
          WHERE customer_id = :id;
        `,
      { id }
    )

    // Return the resource
    ctx.body = data[0]
  } catch (error) {
    console.error('Error occurred:', error)
    ctx.throw(500, error)
  }
})

orders.get(orderPath, checkAccept, async (ctx) => {
  const { id } = ctx.params
  console.log('.get id contains:', id)

  if (isNaN(id) || id.includes('.')) {
    ctx.throw(400, 'id must be an integer')
  }

  try {
    const conn = await mysql.createConnection(connectionSettings)
    const [data] = await conn.execute(
      `
          SELECT *
          FROM orders
          WHERE order_id = :id;
        `,
      { id }
    )

    // Return the resource
    ctx.body = data[0]
  } catch (error) {
    console.error('Error occurred:', error)
    ctx.throw(500, error)
  }
})

delivered.get(deliveryPath, checkAccept, async (ctx) => {
  const { id } = ctx.params
  console.log('.get id contains:', id)

  if (isNaN(id) || id.includes('.')) {
    ctx.throw(400, 'id must be an integer')
  }

  try {
    const conn = await mysql.createConnection(connectionSettings)
    const [data] = await conn.execute(
      `
          SELECT *
          FROM delivered
          WHERE delivery_id = :id;
        `,
      { id }
    )

    // Return the resource
    ctx.body = data[0]
  } catch (error) {
    console.error('Error occurred:', error)
    ctx.throw(500, error)
  }
})

customers.post(
  customersPath,
  checkAccept,
  checkContent,
  koaBody,
  async (ctx) => {
    const { customer_name } = ctx.request.body
    console.log('.post text contains:', customer_name)

    if (typeof customer_name === 'undefined') {
      ctx.throw(400, 'body.text is required')
    } else if (typeof customer_name !== 'string') {
      ctx.throw(400, 'body.done must be string')
    }

    try {
      const conn = await mysql.createConnection(connectionSettings)

      // Insert a new todo
      const [status] = await conn.execute(
        `
            INSERT INTO customers (customer_name)
            VALUES (:customer_name);
          `,
        { customer_name }
      )
      const { insertId } = status

      // Get the new todo
      const [data] = await conn.execute(
        `
            SELECT *
            FROM customers
            WHERE customer_id = :id;
          `,
        { id: insertId }
      )

      // Set the response header to 201 Created
      ctx.status = 201

      // Set the Location header to point to the new resource
      const newUrl = `${ctx.host}${Router.url(customerPath, { id: insertId })}`
      ctx.set('Location', newUrl)

      // Return the new todo
      ctx.body = data[0]
    } catch (error) {
      console.error('Error occurred:', error)
      ctx.throw(500, error)
    }
  }
)

orders.post(ordersPath, checkAccept, checkContent, koaBody, async (ctx) => {
  const { customer_id, amount } = ctx.request.body
  console.log('.post text contains:', amount)

  try {
    const conn = await mysql.createConnection(connectionSettings)

    // Insert a new todo
    const [status] = await conn.execute(
      `
          INSERT INTO orders (customer_id, amount)
          VALUES (:customer_id, :amount);
        `,
      { customer_id, amount }
    )
    const { insertId } = status

    // Get the new todo
    const [data] = await conn.execute(
      `
          SELECT *
          FROM orders
          WHERE order_id = :id;
        `,
      { id: insertId }
    )

    // Set the response header to 201 Created
    ctx.status = 201

    // Set the Location header to point to the new resource
    const newUrl = `${ctx.host}${Router.url(orderPath, { id: insertId })}`
    ctx.set('Location', newUrl)

    // Return the new todo
    ctx.body = data[0]
  } catch (error) {
    console.error('Error occurred:', error)
    ctx.throw(500, error)
  }
})

delivered.post(
  deliveredPath,
  checkAccept,
  checkContent,
  koaBody,
  async (ctx) => {
    const { order_id, delivery_done } = ctx.request.body
    console.log('.post text contains:', order_id)

    try {
      const conn = await mysql.createConnection(connectionSettings)

      // Insert a new todo
      const [status] = await conn.execute(
        `
            INSERT INTO delivered (order_id, delivery_done)
            VALUES (:order_id, :delivery_done);
          `,
        { order_id, delivery_done }
      )
      const { insertId } = status

      // Get the new todo
      const [data] = await conn.execute(
        `
            SELECT *
            FROM delivered
            WHERE delivery_id = :id;
          `,
        { id: insertId }
      )

      // Set the response header to 201 Created
      ctx.status = 201

      // Set the Location header to point to the new resource
      const newUrl = `${ctx.host}${Router.url(deliveryPath, { id: insertId })}`
      ctx.set('Location', newUrl)

      // Return the new todo
      ctx.body = data[0]
    } catch (error) {
      console.error('Error occurred:', error)
      ctx.throw(500, error)
    }
  }
)

customers.put(customerPath, checkAccept, checkContent, koaBody, async (ctx) => {
  const { id } = ctx.params
  const { customer_name } = ctx.request.body

  if (isNaN(id) || id.includes('.')) {
    ctx.throw(400, 'id must be an integer')
  }

  try {
    const conn = await mysql.createConnection(connectionSettings)

    // Update the todo
    const [status] = await conn.execute(
      `
           UPDATE customers
           SET customer_name = :customer_name
           WHERE customer_id = :id;
         `,
      { id, customer_name }
    )

    if (status.affectedRows === 0) {
      // If the resource does not already exist, create it
      await conn.execute(
        `
          INSERT INTO customers (id, customer_name)
          VALUES (:id, :customer_name);
        `,
        { id, customer_name }
      )
    }

    // Get the todo
    const [data] = await conn.execute(
      `
           SELECT *
           FROM customers
           WHERE customer_id = :id;
         `,
      { id }
    )

    // Return the resource
    ctx.body = data[0]
  } catch (error) {
    console.error('Error occurred:', error)
    ctx.throw(500, error)
  }
})

orders.put(orderPath, checkAccept, checkContent, koaBody, async (ctx) => {
  const { id } = ctx.params
  const { customer_id, amount } = ctx.request.body
  console.log('.put id contains:', id)

  if (isNaN(id) || id.includes('.')) {
    ctx.throw(400, 'id must be an integer')
  }

  try {
    const conn = await mysql.createConnection(connectionSettings)

    // Update the todo
    const [status] = await conn.execute(
      `
           UPDATE orders
           SET customer_id = :customer_id, amount = :amount
           WHERE customer_id = :id;
         `,
      { id, customer_id, amount }
    )

    if (status.affectedRows === 0) {
      // If the resource does not already exist, create it
      await conn.execute(
        `
          INSERT INTO orders (id, customer_id, amount)
          VALUES (:id, :customer_id, :amount);
        `,
        { id, customer_id, amount }
      )
    }

    // Get the todo
    const [data] = await conn.execute(
      `
           SELECT *
           FROM orders
           WHERE order_id = :id;
         `,
      { id }
    )

    // Return the resource
    ctx.body = data[0]
  } catch (error) {
    console.error('Error occurred:', error)
    ctx.throw(500, error)
  }
})

delivered.put(deliveryPath, checkAccept, checkContent, koaBody, async (ctx) => {
  const { id } = ctx.params
  const { order_id, delivery_done } = ctx.request.body
  console.log('.put id contains:', id)

  if (isNaN(id) || id.includes('.')) {
    ctx.throw(400, 'id must be an integer')
  }

  try {
    const conn = await mysql.createConnection(connectionSettings)

    // Update the todo
    const [status] = await conn.execute(
      `
           UPDATE delivered
           SET order_id = :order_id, delivery_done = :delivery_done
           WHERE delivery_id = :id;
         `,
      { id, order_id, delivery_done }
    )

    if (status.affectedRows === 0) {
      // If the resource does not already exist, create it
      await conn.execute(
        `
          INSERT INTO delivered (id, order_id, delivery_done)
          VALUES (:id, :order_id, :delivery_done);
        `,
        { id, order_id, delivery_done }
      )
    }

    // Get the todo
    const [data] = await conn.execute(
      `
           SELECT *
           FROM delivered
           WHERE delivery_id = :id;
         `,
      { id }
    )

    // Return the resource
    ctx.body = data[0]
  } catch (error) {
    console.error('Error occurred:', error)
    ctx.throw(500, error)
  }
})

customers.del(customerPath, async (ctx) => {
  const { id } = ctx.params
  console.log('.del id contains:', id)

  if (isNaN(id) || id.includes('.')) {
    ctx.throw(400, 'id must be an integer')
  }

  try {
    const conn = await mysql.createConnection(connectionSettings)
    const [status] = await conn.execute(
      `
          DELETE FROM customers
          WHERE customer_id = :id;
        `,
      { id }
    )

    if (status.affectedRows === 0) {
      // The row did not exist, return '404 Not found'
      ctx.status = 404
    } else {
      // Return '204 No Content' status code for successful delete
      ctx.status = 204
    }
  } catch (error) {
    console.error('Error occurred:', error)
    ctx.throw(500, error)
  }
})

orders.del(orderPath, async (ctx) => {
  const { id } = ctx.params
  console.log('.del id contains:', id)

  if (isNaN(id) || id.includes('.')) {
    ctx.throw(400, 'id must be an integer')
  }

  try {
    const conn = await mysql.createConnection(connectionSettings)
    const [status] = await conn.execute(
      `
          DELETE FROM orders
          WHERE order_id = :id;
        `,
      { id }
    )

    if (status.affectedRows === 0) {
      // The row did not exist, return '404 Not found'
      ctx.status = 404
    } else {
      // Return '204 No Content' status code for successful delete
      ctx.status = 204
    }
  } catch (error) {
    console.error('Error occurred:', error)
    ctx.throw(500, error)
  }
})

delivered.del(deliveryPath, async (ctx) => {
  const { id } = ctx.params
  console.log('.del id contains:', id)

  if (isNaN(id) || id.includes('.')) {
    ctx.throw(400, 'id must be an integer')
  }

  try {
    const conn = await mysql.createConnection(connectionSettings)
    const [status] = await conn.execute(
      `
          DELETE FROM delivered
          WHERE delivery_id = :id;
        `,
      { id }
    )

    if (status.affectedRows === 0) {
      // The row did not exist, return '404 Not found'
      ctx.status = 404
    } else {
      // Return '204 No Content' status code for successful delete
      ctx.status = 204
    }
  } catch (error) {
    console.error('Error occurred:', error)
    ctx.throw(500, error)
  }
})

app.use(customers.routes())
app.use(orders.routes())
app.use(delivered.routes())
app.use(delivered.allowedMethods())
app.use(customers.allowedMethods())
app.use(orders.allowedMethods())

// Start the server and keep listening on port until stopped
app.listen(port)

console.log(`App listening on port ${port}`)
