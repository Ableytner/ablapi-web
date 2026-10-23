export interface MinecraftServerDto {
  host: string;
  port: number;
  motd: string;
  playersOnline: number;
  playersMax: number;
  version: string;
  pingMs: number;
  favicon?: string;
}
