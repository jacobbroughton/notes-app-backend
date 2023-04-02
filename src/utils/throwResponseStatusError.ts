import { getApiUrl } from "./getUrl";

export function throwResponseStatusError(response: Response, method: string) {
  console.log(response)
  response.json().then(res => console.log(res))
  const parsedUrl = response.url.replace(getApiUrl(), "");
  throw `There was an error - ${parsedUrl} - Status ${response.status} - Method ${response}`;
}
