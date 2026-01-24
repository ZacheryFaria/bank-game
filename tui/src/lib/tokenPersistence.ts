import { promises as fs } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const TOKEN_DIR = join(homedir(), '.bank-game');
const TOKEN_FILE = join(TOKEN_DIR, 'token.json');

type TokenData = {
  token: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
  };
};

export async function saveToken(data: TokenData): Promise<void> {
  try {
    await fs.mkdir(TOKEN_DIR, { recursive: true });
    await fs.writeFile(TOKEN_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to save token:', error);
  }
}

export async function loadToken(): Promise<TokenData | null> {
  try {
    const content = await fs.readFile(TOKEN_FILE, 'utf-8');
    const data = JSON.parse(content) as TokenData;

    if (!data.token || !data.refreshToken || !data.user?.id || !data.user?.email) {
      return null;
    }

    return data;
  } catch (error) {
    return null;
  }
}

export async function deleteToken(): Promise<void> {
  try {
    await fs.unlink(TOKEN_FILE);
  } catch (error) {
    // Ignore - file might not exist
  }
}
