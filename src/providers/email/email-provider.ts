export type Email = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export type SentEmail = { id: string };

export interface EmailProvider {
  send(email: Email): Promise<SentEmail>;
}
