"use client";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import Spinner from "@/public/imgs/icons/spinnerOrange.svg";
import { Id } from "react-toastify";
import { useRouter } from "next/navigation";
import { useDataUser } from "@/context/UserDataContext";

interface UserData {
  email: string | undefined;
  areaAtuacao: string | null | undefined;
  admin: boolean | null | undefined;
  nome: string | undefined;
  id: number | undefined;
  eventosCadastrados: {
    id: number;
  }[];

  eventosInscritos: {
    id: number;
    eventoId: number;
  }[];
}

type Props = {
  idEvento: number;
  idVoluntario: number;
  toastSuccess: (message: string) => Id;
  toastError: (message: string) => Id;
  updateUserData: (newEvento: { id: number; eventoId: number }) => void;
  userData: UserData;
};

function ButtonModal({
  idEvento,
  toastError,
  toastSuccess,
  updateUserData,
  userData,
}: Props) {
  const router = useRouter();
  const { id } = useDataUser();
  const [buttonState, setButtonState] = useState({
    loading: false,
  });
  const [verifyInscrito, setVerifyInscrito] = useState<boolean>(false);
  const [cacheSession, setCacheSession] = useState<any[]>([]);

  useEffect(() => {
    const cache = sessionStorage.getItem("eventosCache");
    if (cache) {
      const parsedCache = JSON.parse(cache);
      setCacheSession(parsedCache);

      const existEvent = parsedCache.find(
        (el: any) => el.idEvento === idEvento
      );
      if (existEvent) {
        const isUserInscrito = existEvent.inscritos.some(
          (el: any) => el.voluntarioId === id
        );

        setVerifyInscrito(isUserInscrito);
      }
    }
  }, [id, idEvento]);

  async function handleSubmit() {
    if (verifyInscrito) {
      toastError("Você já está inscrito nesse evento");
      return;
    }

    setButtonState({ loading: true });
    const ids = {
      idEvento: idEvento,
      idVoluntario: id,
    };

    if (!ids.idEvento) {
      toastError("Erro: idEvento não fornecido.");
      setButtonState({ loading: false });
      return;
    }

    if (!ids.idVoluntario) {
      toastError("Erro: idVoluntario não fornecido.");
      setButtonState({ loading: false });
      return;
    }

    try {
      const response = await fetch("/api/evento/cadastro-em-evento", {
        method: "POST",
        body: JSON.stringify(ids),
        headers: {
          "Content-type": "application/json; charset=UTF-8",
        },
      });

      const result = await response.json();
      if (response.ok) {
        const updatedCache = cacheSession.map((el: any) => {
          if (el.idEvento === idEvento) {
            el.inscritos.push(result.inscricao);
          }
          return el;
        });

        sessionStorage.setItem("eventosCache", JSON.stringify(updatedCache));
        setVerifyInscrito(true);
        toastSuccess(result.message);
        setButtonState({ loading: false });
        updateUserData({ eventoId: idEvento, id: Number(id) });
        router.refresh();
      } else {
        toastError(result.error);
        setButtonState({ loading: false });
      }
    } catch (error) {
      toastError("Erro ao enviar dados");
      setButtonState({ loading: false });
    }
  }

  return (
    <>
      {verifyInscrito ? (
        <p className="text-orange-400 text-center mt-4">
          Você já está inscrito nesse evento!
        </p>
      ) : (
        <button
          onClick={handleSubmit}
          className="flex items-center justify-center gap-2 mx-auto mt-12 text-base text-[#F58334] border-[2px] rounded border-[#F58334] py-2 max-w-[316px] w-full"
        >
          {buttonState.loading ? (
            <span className="flex gap-2">
              Se inscrevendo
              <Image src={Spinner} alt="Carregando" className="animate-spin" />
            </span>
          ) : (
            <span>Inscreva-se para esta ação</span>
          )}
        </button>
      )}
    </>
  );
}

export default ButtonModal;
