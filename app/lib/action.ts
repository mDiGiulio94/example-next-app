'use server'
// è una libreria per la validazione dei type di typescript
import { z } from 'zod'
import postgres from 'postgres';
import { revalidatePath } from 'next/cache';
import {redirect} from 'next/navigation';

const sql = postgres(process.env.POSTGRES_URL!, {ssl: 'require'});

// questp generera un form data valido prima di fare la post
// coerce forza il cambio di tipo da quello iniziale ad esempio stringa a numero
const FormSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  amount: z.coerce.number(),
  status: z.enum(['pending', 'paid']),
  date: z.string(),
});
 
const CreateInvoice = FormSchema.omit({ id: true, date: true });

export async function createInvoice(formData: FormData) {
  const { customerId, amount, status } = CreateInvoice.parse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });
//   è buona pratica passare il valore monetario in cent per eliminare javascript floating point error
  const amountInCent = amount * 100;
  const date = new Date().toISOString().split('T')[0];

 await sql`
      INSERT INTO invoices (customer_id, amount, status, date)
      VALUES (${customerId}, ${amountInCent}, ${status}, ${date});
    `;

  revalidatePath('/dashboard/invoices')
  redirect(('/dashboard/invoices'))

}


// Use Zod to update the expected types
const UpdateInvoice = FormSchema.omit({ id: true, date: true });
 
// ...
 
export async function updateInvoice(id: string, formData: FormData) {
  const { customerId, amount, status } = UpdateInvoice.parse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });
 
  const amountInCents = amount * 100;
 
  await sql`
    UPDATE invoices
    SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
    WHERE id = ${id}
  `;
 
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function deleteInvoice(id: string) {
  await sql`DELETE FROM invoices WHERE id = ${id}`;
  revalidatePath('/dashboard/invoices');
}