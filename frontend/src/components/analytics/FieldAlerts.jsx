import React from "react";
import LiveAlerts from "./LiveAlerts";

export default function FieldAlerts({ field }) {
  if (!field) return null;
  return (
    <div className="alert-panel">
        <LiveAlerts fieldId={field.fieldId || field.field_id} />
    </div>
  );
}