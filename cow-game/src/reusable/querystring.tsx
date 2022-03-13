export function parseQueryStringToObject(queryString = location.search) {
  const params = queryString
    .substr(1)
    .split('&')
    .reduce((acc, str) => {
      const tmp = str.split('=');
      acc[tmp[0]] = acc[tmp[0]] || [];
      acc[tmp[0]].push(decodeURIComponent(tmp[1]));
      return acc;
    }, {} as { [key: string]: string[] });

  return params;
}
