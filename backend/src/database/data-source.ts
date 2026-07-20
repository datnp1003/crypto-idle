import * as path from 'path';
import { DataSource, DataSourceOptions } from 'typeorm';
import { ensureDataDir } from './ensure-data-dir';

const dbPath = path.join(ensureDataDir(), 'crypto-idle.sqlite');

export const dataSourceOptions: DataSourceOptions = {
  type: 'better-sqlite3',
  database: dbPath,
  entities: [],
  synchronize: true,
};

export default new DataSource(dataSourceOptions);
