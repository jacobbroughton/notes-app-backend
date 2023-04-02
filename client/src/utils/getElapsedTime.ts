import formatDistanceToNowStrict from "date-fns/formatDistanceToNowStrict";

export const getElapsedTime = (date: string) => {
  // Split timestamp into [ Y, M, D, h, m, s ]
  const datePostedArr = date.split(/[- :]|[T]|[.]/).map((numStr) => parseInt(numStr));

  // Apply each element to the Date function
  const utcDate = new Date(
    Date.UTC(
      datePostedArr[0],
      datePostedArr[1] - 1,
      datePostedArr[2],
      datePostedArr[3],
      datePostedArr[4],
      datePostedArr[5]
    )
  );

  let elapsedTime = formatDistanceToNowStrict(utcDate, { addSuffix: true });
  elapsedTime = elapsedTime.replace(" years", "y");
  elapsedTime = elapsedTime.replace(" year", "y");
  elapsedTime = elapsedTime.replace(" days", "d");
  elapsedTime = elapsedTime.replace(" day", "d");
  elapsedTime = elapsedTime.replace(" hours", "h");
  elapsedTime = elapsedTime.replace(" hour", "h");
  elapsedTime = elapsedTime.replace(" minutes", "m");
  elapsedTime = elapsedTime.replace(" minute", "m");

  let matchArr = elapsedTime.match(/\d+/g);

  if (!matchArr) throw "There was an error determining elapsed time";

  let matchNum = parseInt(matchArr[0]);

  if (
    matchNum <= 10 &&
    (elapsedTime.includes("seconds") || elapsedTime.includes("second"))
  ) {
    elapsedTime = "a few seconds ago";
  } else {
    elapsedTime = elapsedTime.replace(" seconds", "s");
  }

  return elapsedTime;
};
