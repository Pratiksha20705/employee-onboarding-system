import api, { apiErrorMessage } from "./api";

function adaptActivity(a) {
  return {
    id: a.id,
    name: a.activityName,
    description: "",
    scheduledDate: null,
    assignedTo: "",
    status: a.completed ? "Completed" : "Pending",
  };
}

export async function fetchInductionActivities(candidateId) {
  const { data } = await api.get(`/candidates/${candidateId}/induction`);
  return data.map(adaptActivity);
}

export async function markActivityComplete(candidateId, activityId) {
  try {
    const { data } = await api.patch(`/induction/${activityId}/complete`);
    return adaptActivity(data);
  } catch (err) {
    throw new Error(apiErrorMessage(err, "Could not complete this activity."));
  }
}

export async function createInductionActivity(candidateId, payload) {
  try {
    const { data } = await api.post(`/candidates/${candidateId}/induction`, {
      activityName: payload.name,
    });
    return adaptActivity(data);
  } catch (err) {
    throw new Error(apiErrorMessage(err, "Could not add induction activity."));
  }
}
