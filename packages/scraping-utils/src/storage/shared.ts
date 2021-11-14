export type Storage<Payload> = {
  read: () => Promise<Payload[]>;
  write: (payloads: Payload[]) => Promise<void>;
  clear: () => Promise<void>;
};
