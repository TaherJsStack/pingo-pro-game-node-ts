import jwt, { JwtPayload } from 'jsonwebtoken';
import BlacklistedToken from '../../models/black-listed-token';
import dotenv from 'dotenv';
dotenv.config();

export class TokenManager {
  private secretKey: string = process.env.SECRET!;
  private expiresIn: string | number = '3d';

  constructor() {}

  // Generate a new token
  generateToken(payload: object): string {
    return jwt.sign(payload, this.secretKey, { expiresIn: this.expiresIn });
  }

  // Verify a token
  async verifyToken(token: string): Promise<JwtPayload | string | null> {
    try {
      const isRevoked = await this.isTokenRevoked(token);
      if (isRevoked) {
        throw new Error('Token is revoked');
      }
      return jwt.verify(token, this.secretKey);
    } catch (error) {
      console.error('Token verification failed:', error);
      return null;
    }
  }

  // Refresh a token
  async refreshToken(token: string): Promise<string | null> {
    try {
      const payload = jwt.verify(token, this.secretKey) as JwtPayload;
      const isRevoked = await this.isTokenRevoked(token);
      if (isRevoked) {
        throw new Error('Token is revoked');
      }
      delete payload.iat; // Remove issued at
      delete payload.exp; // Remove expiration
      return this.generateToken(payload);
    } catch (error) {
      console.error('Token refresh failed:', error);
      return null;
    }
  }

  // Revoke a token by adding it to the blacklist
  async revokeToken(token: string): Promise<void> {
    try {
      const payload = jwt.decode(token) as JwtPayload;
      if (payload && payload.exp) {
        const expirationDate = new Date(payload.exp * 1000);
        const blacklistedToken = new BlacklistedToken({
          token,
          expiresAt: expirationDate,
        });
        await blacklistedToken.save();
        console.log('Token revoked:', token);
      }
    } catch (error) {
      console.error('Token revocation failed:', error);
    }
  }

  // Check if a token is revoked
  private async isTokenRevoked(token: string): Promise<boolean> {
    const result = await BlacklistedToken.findOne({ token });
    return !!result;
  }
}

// ------------------------------------------------------------------------------
// --------------------------------> Usage example <-----------------------------
// ------------------------------------------------------------------------------

// Usage example:
const tokenManager = new TokenManager();

// (async () => {
//   // Generate a token
//   const payload = { userId: 1 };
//   const token = tokenManager.generateToken(payload);
//   console.log('Generated Token:', token);

//   // Verify the token
//   const verifiedPayload = await tokenManager.verifyToken(token);
//   console.log('Verified Payload:', verifiedPayload);

//   // Refresh the token
//   const refreshedToken = await tokenManager.refreshToken(token);
//   console.log('Refreshed Token:', refreshedToken);

//   // Revoke the token
//   await tokenManager.revokeToken(token);

//   // Try verifying the revoked token
//   const revokedTokenPayload = await tokenManager.verifyToken(token);
//   console.log('Revoked Token Payload:', revokedTokenPayload); // Should be null
// })();



// import jwt, { JwtPayload } from 'jsonwebtoken';
// import { createClient, RedisClientType } from 'redis';

// class TokenManager {
//   private secretKey: string;
//   private expiresIn: string | number;
//   private redisClient: RedisClientType;

//   constructor(secretKey: string, expiresIn: string | number, redisUrl: string) {
//     this.secretKey = secretKey;
//     this.expiresIn = expiresIn;
//     this.redisClient = createClient({ url: redisUrl });
//     this.redisClient.connect().catch(console.error);
//   }

//   // Generate a new token
//   generateToken(payload: object): string {
//     return jwt.sign(payload, this.secretKey, { expiresIn: this.expiresIn });
//   }

//   // Verify a token
//   async verifyToken(token: string): Promise<JwtPayload | string | null> {
//     try {
//       const isRevoked = await this.isTokenRevoked(token);
//       if (isRevoked) {
//         throw new Error('Token is revoked');
//       }
//       return jwt.verify(token, this.secretKey);
//     } catch (error) {
//       console.error('Token verification failed:', error);
//       return null;
//     }
//   }

//   // Refresh a token
//   async refreshToken(token: string): Promise<string | null> {
//     try {
//       const payload = jwt.verify(token, this.secretKey) as JwtPayload;
//       const isRevoked = await this.isTokenRevoked(token);
//       if (isRevoked) {
//         throw new Error('Token is revoked');
//       }
//       delete payload.iat; // Remove issued at
//       delete payload.exp; // Remove expiration
//       return this.generateToken(payload);
//     } catch (error) {
//       console.error('Token refresh failed:', error);
//       return null;
//     }
//   }

//   // Revoke a token by adding it to the blacklist
//   async revokeToken(token: string): Promise<void> {
//     try {
//       const payload = jwt.decode(token) as JwtPayload;
//       if (payload && payload.exp) {
//         const expirationTime = payload.exp * 1000 - Date.now();
//         await this.redisClient.set(token, 'revoked', { EX: expirationTime / 1000 });
//         console.log('Token revoked:', token);
//       }
//     } catch (error) {
//       console.error('Token revocation failed:', error);
//     }
//   }

//   // Check if a token is revoked
//   private async isTokenRevoked(token: string): Promise<boolean> {
//     const result = await this.redisClient.get(token);
//     return result === 'revoked';
//   }
// }

// // Usage example:
// const secretKey = 'your-secret-key';
// const expiresIn = '1h';
// const redisUrl = 'redis://localhost:6379'; // Update with your Redis URL
// const tokenManager = new TokenManager(secretKey, expiresIn, redisUrl);

// (async () => {
//   // Generate a token
//   const payload = { userId: 1 };
//   const token = tokenManager.generateToken(payload);
//   console.log('Generated Token:', token);

//   // Verify the token
//   const verifiedPayload = await tokenManager.verifyToken(token);
//   console.log('Verified Payload:', verifiedPayload);

//   // Refresh the token
//   const refreshedToken = await tokenManager.refreshToken(token);
//   console.log('Refreshed Token:', refreshedToken);

//   // Revoke the token
//   await tokenManager.revokeToken(token);

//   // Try verifying the revoked token
//   const revokedTokenPayload = await tokenManager.verifyToken(token);
//   console.log('Revoked Token Payload:', revokedTokenPayload); // Should be null
// })();


// -------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------



// import jwt, { JwtPayload } from 'jsonwebtoken';
 
// export class TokenManager {
//   private secretKey: string;
//   private expiresIn: string | number;

//   constructor(secretKey: string, expiresIn: string | number) {
//     this.secretKey = secretKey;
//     this.expiresIn = expiresIn;
//   }

//   // Generate a new token
//   generateToken(payload: object): string {
//     return jwt.sign(payload, this.secretKey, { expiresIn: this.expiresIn });
//   }

//   // Verify a token
//   verifyToken(token: string): JwtPayload | string | null {
//     try {
//       return jwt.verify(token, this.secretKey);
//     } catch (error) {
//       console.error('Token verification failed:', error);
//       return null;
//     }
//   }

//   // Refresh a token
//   refreshToken(token: string): string | null {
//     try {
//       const payload = jwt.verify(token, this.secretKey) as JwtPayload;
//       delete payload.iat; // Remove issued at
//       delete payload.exp; // Remove expiration
//       return this.generateToken(payload);
//     } catch (error) {
//       console.error('Token refresh failed:', error);
//       return null;
//     }
//   }

//   // Revoke a token (In this example, token revocation is a no-op, but could be implemented using a token blacklist)
//   revokeToken(token: string): void {
//     // Implement token revocation logic, such as adding to a blacklist
//     console.log('Token revoked:', token);
//   }
// }

// // Usage example:
// // const secretKey = 'your-secret-key';
// // const expiresIn = '1h';
// // const tokenManager = new TokenManager(secretKey, expiresIn);

// // // Generate a token
// // const payload = { userId: 1 };
// // const token = tokenManager.generateToken(payload);
// // console.log('Generated Token:', token);

// // // Verify the token
// // const verifiedPayload = tokenManager.verifyToken(token);
// // console.log('Verified Payload:', verifiedPayload);

// // // Refresh the token
// // const refreshedToken = tokenManager.refreshToken(token);
// // console.log('Refreshed Token:', refreshedToken);

// // // Revoke the token
// // tokenManager.revokeToken(token);
