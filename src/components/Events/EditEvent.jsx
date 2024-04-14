import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation } from "@tanstack/react-query";

import Modal from '../UI/Modal.jsx';
import EventForm from './EventForm.jsx';
import { fetchEvent, updateEvent } from '../../util/http.js';
import LoadingIndicator from '../UI/LoadingIndicator.jsx';
import ErrorBlock from '../UI/ErrorBlock.jsx';
import { queryClient } from "../../util/http.js";

export default function EditEvent() {
  const navigate = useNavigate();
  const params = useParams();
  const { mutate, isPending: isMutationPending } = useMutation({
    mutationFn: updateEvent,
    onMutate: async (data) =>{
      const newEvent = data.event;
      await queryClient.cancelQueries({queryKey:["events", params.id]});
      const prevEvent = queryClient.getQueryData(["events", params.id]);
      queryClient.setQueryData(["events", params.id], newEvent);

      return {prevEvent};
    },
    onError: (error, data, context) => {
      queryClient.setQueryData(["events", params.id], context.prevEvent);
    },
    onSettled: () => {
      queryClient.invalidateQueries(["events", params.id]);
    }
  });

  const { data, isPending, isError, error } = useQuery({
    queryKey:["events", {id: params.id}],
    queryFn: ({signal}) => fetchEvent({signal, id: params.id})
  });

  function handleSubmit(formData) {
    mutate({id: params.id, event: formData});
    navigate("../")
  }

  function handleClose() {
    navigate('../');
  }

  let content;

  if(isPending){
    content = <div className='center'>
      <LoadingIndicator />
    </div>
  }

  if(isMutationPending){
    content = <div className='center'>
      <LoadingIndicator />
    </div>
  }

  if(isError){
    content = <>
      <ErrorBlock title="Failed to load the event" message={error.info?.message || "Failed to load the event, please try after sometime."}/>
      <div className='"form-actions'>
        <Link to="../" className='button'>Okay</Link>
      </div>
    </>
  }

  if(data){
    content = <EventForm inputData={data} onSubmit={handleSubmit}>
    <Link to="../" className="button-text">
      Cancel
    </Link>
    <button type="submit" className="button">
      Update
    </button>
  </EventForm>
  }

  return (
    <Modal onClose={handleClose}>
      {content}
    </Modal>
  );
}
