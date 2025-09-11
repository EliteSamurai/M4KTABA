"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Address = {
  id: string;
  name?: string;
  street1?: string;
  street2?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
};

export function SavedAddressPicker({
  addresses,
  onUse,
}: {
  addresses: Address[];
  onUse: (addr: Address) => void;
}) {
  const [selected, setSelected] = useState<string | null>(
    addresses[0]?.id || null
  );
  return (
    <Card>
      <CardHeader>
        <CardTitle>Saved addresses</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {addresses.map((a) => (
            <label key={a.id} className="flex items-start gap-3">
              <input
                type="radio"
                name="saved-address"
                checked={selected === a.id}
                onChange={() => setSelected(a.id)}
              />
              <div className="text-sm">
                <div className="font-medium">{a.name || "Saved address"}</div>
                <div className="text-muted-foreground">
                  {[a.street1, a.street2, a.city, a.state, a.zip, a.country]
                    .filter(Boolean)
                    .join(", ")}
                </div>
              </div>
            </label>
          ))}
        </div>
        <div className="mt-4">
          <Button
            type="button"
            onClick={() => {
              const addr = addresses.find((x) => x.id === selected);
              if (addr) onUse(addr);
            }}
          >
            Use this address
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
