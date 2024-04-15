import { useCookies } from "react-cookie";
import { useNavigate } from "react-router-dom";
import axios, { type AxiosResponse, type AxiosError } from "axios";
import { useMutation } from "@tanstack/react-query";
import type { SignInRequest } from "./types";
import toast from "react-hot-toast";
// import { useToast } from "@jobis/ui";

const router = "/users";

/** 로그인 */
export const useSignIn = (signInData: SignInRequest, isCheck: boolean) => {
  const navigator = useNavigate();
  const [, setCookies, removeCookies] = useCookies();
  //   const { toast } = useToast();

  return useMutation({
    mutationFn: async () =>
      axios.post(`${import.meta.env.VITE_BASE_URL}${router}/login`, signInData),
    onSuccess: (res: AxiosResponse) => {
      if (res.data.authority === "TEACHER") {
        if (isCheck) {
          setCookies("account_id", signInData.account_id);
        } else {
          removeCookies("account_id");
        }
        const accessExpired = new Date(res.data.access_expires_at);
        const refreshExpired = new Date(res.data.refresh_expires_at);
        setCookies("refresh_token", res.data.refresh_token, {
          expires: refreshExpired,
        });
        setCookies("access_token", res.data.access_token, {
          expires: accessExpired,
        });
        navigator("/recruitment");
      } else {
        toast.error("해당 계정은 사용할 수 없어요.");
        // toast({
        //   payload: {
        //     message: "해당 계정은 사용할 수 없어요.",
        //     type: "error",
        //   },
        // });
      }
      toast.success("로그인에 성공하였습니다.");
      //   toast({
      //     payload: {
      //       message: "로그인에 성공하였습니다.",
      //       type: "success",
      //     },
      //   });
    },
    onError: (err: AxiosError<AxiosError>) => {
      if (err.response) {
        switch (err.response.status) {
          case 400:
            toast.error("아이디와 비밀번호를 다시 확인해주세요.");
            // toast({
            //   payload: {
            //     message: "비밀번호를 다시 확인해주세요.",
            //     type: "error",
            //   },
            // });
            break;

          case 401:
            toast.error("비밀번호를 다시 확인해주세요.");
            // toast({
            //   payload: {
            //     message: "비밀번호를 다시 확인해주세요.",
            //     type: "error",
            //   },
            // });
            break;

          case 404:
            toast.error("아이디와 비밀번호를 다시 확인해주세요.");
            // toast({
            //   payload: {
            //     message: "아이디와 비밀번호를 다시 확인해주세요.",
            //     type: "error",
            //   },
            // });
            break;

          case 500:
            toast.error("개발자에게 문의해주세요.");
            // toast({
            //   payload: {
            //     message: "개발자에게 문의해주세요.",
            //     type: "error",
            //   },
            // });
            break;
        }
      } else {
        toast.error("네트워크 연결을 확인해주세요.");
        // toast({
        //   payload: {
        //     message: "네트워크 연결을 확인해주세요.",
        //     type: "error",
        //   },
        // });
      }
    },
  });
};
