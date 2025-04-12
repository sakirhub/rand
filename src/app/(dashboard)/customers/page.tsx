"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

interface Customer {
  id: string;
  email: string;
  full_name: string;
  phone: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const supabase = createClientComponentClient();

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .order("name");
      
      if (error) throw error;
      
      const formattedCustomers = data?.map(customer => ({
        id: customer.id,
        email: customer.email,
        full_name: customer.name,
        phone: customer.phone
      })) || [];

      setCustomers(formattedCustomers);
      
    } catch (error) {
      console.error("Müşteriler getirilirken hata:", error);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]); // fetchCustomers'ı dependency array'e ekledik

  return (
    <div>
      {/* Müşteri listesi render edilecek */}
      {customers.map(customer => (
        <div key={customer.id}>
          <h3>{customer.full_name}</h3>
          <p>{customer.email}</p>
          <p>{customer.phone}</p>
        </div>
      ))}
    </div>
  );
} 