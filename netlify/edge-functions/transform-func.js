export default async (request, context) => {
  const url = new URL(request.url)

  // const query = url.searchParams.get('method')
  // console.dir({ url, query })
  // if (query !== 'transform') {
  //   return
  // }

  const response = await context.next()
  const page = await response.text()
  const city = context.geo.city
  const country = context.geo.country.name
  const regex = /LOCATION_UNKNOWN/i

  context.log(city, country)

  const location = `${city},  ${country}`
  const updatedPage = page.replace(regex, location)
  return new Response(updatedPage, response)
}
