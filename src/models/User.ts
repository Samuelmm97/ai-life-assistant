import { v4 as uuidv4 } from 'uuid';

export interface UserPreferences {
  timezone: string;
  workingHours: {
    start: string; // HH:MM format
    end: string;   // HH:MM format
  };
  energyPeakHours: string[]; // Array of hours when user has most energy
  preferredDomains: string[]; // Life domains user is most interested in
}

export interface User {
  id: string;
  email: string;
  name: string;
  preferences: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
}

export class UserModel {
  public id: string;
  public email: string;
  public name: string;
  public preferences: UserPreferences;
  public createdAt: Date;
  public updatedAt: Date;

  constructor(data: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) {
    this.id = uuidv4();
    this.email = data.email;
    this.name = data.name;
    this.preferences = data.preferences;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  public update(updates: Partial<Omit<User, 'id' | 'createdAt'>>): void {
    Object.assign(this, updates);
    this.updatedAt = new Date();
  }

  public toJSON(): User {
    return {
      id: this.id,
      email: this.email,
      name: this.name,
      preferences: this.preferences,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}