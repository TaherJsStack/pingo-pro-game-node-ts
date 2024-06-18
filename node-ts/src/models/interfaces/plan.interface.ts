
export interface IPlan extends Document {
  name: string;
  description: string;
  price: number;
  durationMonths: number;
}
