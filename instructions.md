# Meadow Coding Exercise

Please limit the time you spend on this to \~2 hours. Create and initialize a GitHub repo when you start working on this exercise, and share the link to the repo when you are finished. More information is in the Submission section below.

## Context

[Inngest](https://www.inngest.com/) is a developer platform that simplifies the creation of reliable, event-driven workflows without the need for managing underlying infrastructure. It enables developers to write functions that respond to events, supporting durable execution, flow control, and seamless integration with various services. ￼ ￼

## Coding Exercise: Implement an Inngest Function

### Objective

Write an Inngest function in your preferred programming language that performs the following tasks upon receiving a `movie.watched` event:

1. Fetches movie information from the [Open Movie Database (OMDb) API](https://www.omdbapi.com/) based on the movie title provided in the event.
2. Sends an email containing the movie’s plot summary to the email address specified in the event, utilizing [Resend](https://resend.com/)’s email-sending capabilities.

### Event Structure

The event triggering the function will have the following JSON structure:

```
{
  "name": "meadow_api/movie.watched",
  "data": {
    "movie_title": "The Matrix",
    "recipient_email": "peter@test.com"
  }
}
```

### Requirements

- Fetch Movie Data: Use the OMDb API to retrieve information about the movie specified by movie_title.
- Send Email: Utilize Resend’s API to send an email to recipient_email containing the movie’s plot summary.
- Error Handling: Implement appropriate error handling.
- Configure Inngest: Maximize the chances of successfully sending the email to the recipient.

### Resources

- Inngest [Getting Started Guide](https://www.inngest.com/docs)
- OMDb [API Documentation](https://www.omdbapi.com/)
- Resend [Documentation](https://resend.com/docs/introduction)

### Submission

Please submit your solution as a GitHub repository link containing:

- The source code of the Inngest function.
- A short README.md file with setup instructions and any assumptions made.
  - You can assume that we have an OMDb API key and Resend credentials. No need to include those in your codebase.
  - Include at least one recommendation for improving this coding exercise.

Send your submission to [peter.hoburg@callmeadow.com](mailto:peter.hoburg@callmeadow.com) when the exercise is completed.
