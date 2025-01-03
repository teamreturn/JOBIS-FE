"use client";

import * as S from "./style";
import { TitleTemplate } from "@/components/titleTemplate";
import { SubTitleTemplate } from "@/components/subTitleTemplate";
import { InputTemplate } from "@/components/inputTemplate";
import {
  Text,
  Input,
  Icon,
  Flex,
  Checkbox,
  Button,
  Textarea,
  useToast,
} from "@jobis/ui";
import { themes } from "@jobis/design-token";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import {
  IArea,
  IHiringProgress,
  IRecruitment,
} from "@/apis/recruitments/types";
import React, { useEffect, useState } from "react";
import { useModal } from "@/hooks/useModal";
import Modal from "@/components/modal";
import ProgressModal from "@/components/modal/progressModal/progressModal";
import { regex } from "@/utils/regex";
import { useSearchParams } from "next/navigation";
import GatherModal from "@/components/modal/recruitmentModal/recruitmentModal";
import { useAreaState } from "@/store/areasState";
import { useGetCode } from "@/hooks/apis/useCodeApi";
import XBtn from "../../../../public/X.svg";
import TechModal from "@/components/modal/techModal/techModal";
import LicenseModal from "@/components/modal/licenseModal/licenseModal";
import {
  useAddRecruitArea,
  useDeleteRecruitArea,
  useRecruitmentDetail,
  useUpdateRecruitArea,
  useUpdateRecruitment,
} from "@/hooks/apis/useRecruitmentsApi";
import { useTechState } from "@/store/techState";
import { ICode } from "@/apis/codes/types";
import { useAddedJob, useAddedTech } from "@/store/addCodeState";
import Link from "next/link";

export default function Recruitments({ params }: { params: { id: string } }) {
  const { data: techName } = useGetCode("TECH");
  const { data: jobName } = useGetCode("JOB");
  const { data: recruitmentDetail } = useRecruitmentDetail(params!.id);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setValue,
    control,
    reset,
  } = useForm<IRecruitment & { start_time: string; end_time: string }>({
    values: {
      integration_plan: !!recruitmentDetail?.integration_plan,
      winter_intern: recruitmentDetail?.winter_intern,
      benefits: recruitmentDetail?.benefits,
      end_date: recruitmentDetail?.end_date,
      etc: recruitmentDetail?.etc,
      hiring_progress: recruitmentDetail?.hiring_progress || [],
      military_support: !!recruitmentDetail?.military,
      pay: regex.money(recruitmentDetail?.pay || ""),
      additional_qualifications: recruitmentDetail?.additional_qualifications,
      required_licenses: recruitmentDetail?.required_licenses || [],
      start_date: recruitmentDetail?.start_date,
      train_pay: regex.money(recruitmentDetail?.train_pay.toString() || ""),
      flexible_working: !!recruitmentDetail?.flexible_working,
      hire_convertible: !!recruitmentDetail?.hire_convertible,
      areas:
        recruitmentDetail?.areas.map(area => {
          return {
            id: area.id,
            hiring: area.hiring,
            preferential_treatment: area.preferential_treatment,
            major_task: area.major_task,
            job_codes: area.job.map(res => res.id),
            tech_codes: area.tech.map(res => res.id),
          } as IArea;
        }) || [],
      working_hours: "",
      personal_contact: false,
      start_time: "",
      end_time: "",
    },
  });

  const [alwaysRecruit, setAlwaysRecruit] = useState(false);
  const searchParams = useSearchParams();
  const [areaIndex, setAreaIndex] = useState<number | null>(null);

  const { modalState, closeModal, openModal } = useModal();
  const { addedJob, setAddedJob } = useAddedJob();
  const { addedTechList, setAddedTechList } = useAddedTech();

  const { toast } = useToast();

  const preventClose = (e: BeforeUnloadEvent) => {
    e.preventDefault();
    e.returnValue = ""; //Chrome에서 동작하도록; deprecated
  };

  useEffect(() => {
    (() => {
      window.addEventListener("beforeunload", preventClose);
    })();

    return () => {
      window.removeEventListener("beforeunload", preventClose);
    };
  }, []);

  useEffect(() => {
    if (alwaysRecruit) {
      setValue("start_date", undefined);
      setValue("end_date", undefined);
    }
  }, [alwaysRecruit, setValue]);

  useEffect(() => {
    if (searchParams.get("winter")) {
      setValue("winter_intern", true);
    } else {
      setValue("winter_intern", false);
    }
  }, [searchParams, setValue]);

  const [hiringProgress, setHiringProgress] = useState<IHiringProgress[]>([]);
  const [areas, setAreas] = useState<IArea[]>([]);
  const [submitDocumentOption, setSubmitDocumentOption] = useState({
    self_introduction: false,
    resume: false,
    portfolio: false,
  });
  const [licenses, setLicenses] = useState<string[]>([]);
  const [deleteAreas, setDeleteAreas] = useState<IArea[]>([]);

  const { resetArea, setArea } = useAreaState();
  const { resetTechList, setTechList } = useTechState();

  useEffect(() => {
    setValue("hiring_progress", hiringProgress);
  }, [watch, hiringProgress, setValue]);

  useEffect(() => {
    setValue("areas", areas);
  }, [watch, areas, setValue]);

  useEffect(() => {
    setValue("required_licenses", licenses);
  }, [licenses, setValue]);

  const changeCheckbox = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setSubmitDocumentOption(prev => ({ ...prev, [name]: !checked }));
  };

  const { mutateAsync: updateRecruitment } = useUpdateRecruitment(params!.id);
  const { mutateAsync: updateRecruitArea } = useUpdateRecruitArea();
  const { mutateAsync: addRecruitArea } = useAddRecruitArea(params!.id);
  const { mutateAsync: deleteRecruitArea } = useDeleteRecruitArea();

  const onSubmit: SubmitHandler<
    IRecruitment & { start_time: string; end_time: string }
  > = async data => {
    const {
      pay,
      train_pay,
      submit_document,
      benefits,
      additional_qualifications,
      etc,
      working_hours,
      start_time,
      end_time,
      areas: editAreas,
      military_support,
      ...rest
    } = data;
    const document = [];
    if (submit_document) {
      document.push(submit_document);
    }
    if (!submitDocumentOption.portfolio) {
      document.push("포트폴리오");
    }
    if (!submitDocumentOption.resume) {
      document.push("이력서");
    }
    if (!submitDocumentOption.self_introduction) {
      document.push("자기소개서");
    }

    if (data.hiring_progress.length <= 0) {
      return toast({
        payload: {
          type: "error",
          message: "채용절차를 입력해주세요",
        },
      });
    } else if (editAreas.length <= 0) {
      return toast({
        payload: {
          type: "error",
          message: "모집분야를 입력해주세요",
        },
      });
    }

    await Promise.all(
      editAreas
        .filter(area => !area.id)
        .map(async area => await addRecruitArea(area))
    );
    await Promise.all(
      editAreas
        .filter(area => !!area.id)
        .map(async area => await updateRecruitArea(area))
    );
    await Promise.all(
      deleteAreas.map(async area => await deleteRecruitArea(area.id!))
    );

    await updateRecruitment({
      ...rest,
      submit_document: document.join(", "),
      pay: pay?.replaceAll(",", "") || undefined,
      train_pay: train_pay.replaceAll(",", ""),
      benefits: benefits || undefined,
      additional_qualifications: additional_qualifications || undefined,
      working_hours: watch("flexible_working")
        ? working_hours
        : `${start_time} ~ ${end_time}`,
      military: military_support || false,
      etc: etc || undefined,
    });
  };

  useEffect(() => {
    if (recruitmentDetail) {
      setAreas(
        recruitmentDetail.areas.map(area => {
          return {
            id: area.id,
            hiring: area.hiring,
            major_task: area.major_task,
            preferential_treatment: area.preferential_treatment ?? "",
            job_codes: area.job.map(res => res.id),
            tech_codes: area.tech.map(res => res.id),
          } as IArea;
        })
      );
      if (!recruitmentDetail.start_date && !recruitmentDetail.end_date) {
        setAlwaysRecruit(true);
      }
      recruitmentDetail.areas.map(area =>
        setAddedJob(
          area.job
            .filter(
              job =>
                !jobName?.codes.map(jobCode => jobCode.code).includes(job.id)
            )
            .map(job => ({ keyword: job.name, code: job.id }))
        )
      );
      recruitmentDetail.areas.map(area =>
        setAddedTechList(
          area.tech
            .filter(
              tech =>
                !techName?.codes
                  .map(techCode => techCode.code)
                  .includes(tech.id)
            )
            .map(tech => ({ keyword: tech.name, code: tech.id }))
        )
      );
      setLicenses(recruitmentDetail.required_licenses);
      setHiringProgress(recruitmentDetail.hiring_progress);
      const documents = recruitmentDetail.submit_document?.split(", ");
      if (!documents?.includes("자기소개서")) {
        setSubmitDocumentOption(document => ({
          ...document,
          self_introduction: true,
        }));
      }
      if (!documents?.includes("이력서")) {
        setSubmitDocumentOption(document => ({
          ...document,
          resume: true,
        }));
      }
      if (!documents?.includes("포트폴리오")) {
        setSubmitDocumentOption(document => ({
          ...document,
          portfolio: true,
        }));
      }
      setValue(
        "submit_document",
        documents
          ?.filter(
            document =>
              document != "이력서" &&
              document != "자기소개서" &&
              document != "포트폴리오"
          )
          .join(", ")
      );
      if (recruitmentDetail.flexible_working) {
        setValue("working_hours", recruitmentDetail.working_hours);
      } else {
        const [startTime, endTime] =
          recruitmentDetail.working_hours.split(" ~ ");
        setValue("start_time", startTime?.slice(0, 5));
        setValue("end_time", endTime?.slice(0, 5));
      }
    }
  }, [recruitmentDetail, setValue, params.id]);

  return (
    <S.Container
      onSubmit={handleSubmit(onSubmit)}
      onKeyPress={event => {
        const target = event.target as HTMLElement;
        if (event.key === "Enter" && target.tagName.toLowerCase() === "input") {
          event.preventDefault();
        }
      }}
    >
      <TitleTemplate
        title={`모집의뢰서 수정 (${recruitmentDetail?.winter_intern ? "체험형" : "채용형"})`}
        subTitle={
          "등록된 정보는 본 시스템을 통해 접수된 건에 한하여\n정식적으로 검토되며, 등록된 정보는 서비스 이용에 활용됩니다."
        }
      />
      <SubTitleTemplate
        title="모집 년도"
        requiredMessage
        components={[
          <InputTemplate key="recruitment_period" title="모집기간" required>
            <Flex direction="column" gap={8}>
              <Flex align="center" gap={22}>
                <Controller
                  control={control}
                  name="start_date"
                  defaultValue=""
                  rules={{
                    required: {
                      value: !alwaysRecruit,
                      message: "필수 입력 항목입니다.",
                    },
                    pattern: {
                      value: /^\d{4}-\d{2}-\d{2}$/,
                      message: "유효한 날짜 형식이 아닙니다. (ex: yyyy-mm-dd)",
                    },
                  }}
                  render={({ field }) => (
                    <Input
                      {...field}
                      width={272}
                      placeholder="yyyy-mm-dd"
                      disabled={alwaysRecruit}
                      maxLength={10}
                      icon={
                        <Icon
                          icon="Date"
                          color={themes.Color.grayScale[80]}
                          size={20}
                          cursor="pointer"
                        />
                      }
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        field.onChange(regex.date_number(e.target.value))
                      }
                      errorMessage={
                        alwaysRecruit ? undefined : errors.start_date?.message
                      }
                    />
                  )}
                />
                <Text fontSize="h5" color={themes.Color.grayScale[60]}>
                  ~
                </Text>
                <Controller
                  control={control}
                  name="end_date"
                  defaultValue=""
                  rules={{
                    required: {
                      value: !alwaysRecruit,
                      message: "필수 입력 항목입니다.",
                    },
                    pattern: {
                      value: /^\d{4}-\d{2}-\d{2}$/,
                      message: "유효한 날짜 형식이 아닙니다. (ex: yyyy-mm-dd)",
                    },
                  }}
                  render={({ field }) => (
                    <Input
                      {...field}
                      width={272}
                      placeholder="yyyy-mm-dd"
                      disabled={alwaysRecruit}
                      maxLength={10}
                      icon={
                        <Icon
                          icon="Date"
                          color={themes.Color.grayScale[80]}
                          size={20}
                          cursor="pointer"
                        />
                      }
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        field.onChange(regex.date_number(e.target.value))
                      }
                      errorMessage={
                        alwaysRecruit ? undefined : errors.end_date?.message
                      }
                    />
                  )}
                />
              </Flex>
              <Checkbox
                checked={alwaysRecruit}
                onClick={() => setAlwaysRecruit(prev => !prev)}
              >
                상시채용
              </Checkbox>
            </Flex>
          </InputTemplate>,
        ]}
      />
      <SubTitleTemplate
        title="모집 분야"
        components={[
          <InputTemplate
            key="add_recruitment_field"
            title="모집 분야 추가"
            required
          >
            <Flex direction="column" gap={8} style={{ width: 604 }}>
              <Button
                type="button"
                variant="outline"
                onClick={() => openModal("GATHER_FIELD")}
              >
                추가
              </Button>
              {areas.length > 0 && (
                <S.Boxs>
                  {areas.map((area, idx) => {
                    const {
                      id,
                      job_codes,
                      tech_codes,
                      hiring,
                      major_task,
                      preferential_treatment,
                    } = area;
                    return (
                      <S.GatherFieldBox key={idx}>
                        <S.FieldBoxTitle>
                          분야:{" "}
                          {jobName?.codes
                            .concat(addedJob)
                            .filter(code => job_codes?.includes(code.code))
                            .map(code => code.keyword)
                            .join(" / ")}
                        </S.FieldBoxTitle>
                        <S.FieldText>
                          사용기술 :{" "}
                          {techName?.codes
                            .concat(addedTechList)
                            .filter(code => tech_codes?.includes(code?.code))
                            .map(code => `${code?.keyword}`)
                            .join(", ") || "없음"}
                        </S.FieldText>
                        <S.FieldText style={{ top: 70 }}>
                          주요 업무 : {"\n"}
                          {major_task || "없음"}
                        </S.FieldText>
                        <S.FieldText style={{ top: 70 }}>
                          우대사항 : {"\n"}
                          {preferential_treatment || "없음"}
                        </S.FieldText>
                        <S.PeopleCount>{hiring}명</S.PeopleCount>
                        <Icon
                          icon="EditPencil"
                          size={12}
                          style={{
                            position: "absolute",
                            right: 40,
                            top: 15,
                          }}
                          onClick={() => {
                            openModal("GATHER_FIELD");
                            setArea({
                              id,
                              job_codes,
                              tech_codes,
                              hiring,
                              major_task,
                              preferential_treatment,
                            });
                            setTechList(
                              tech_codes
                                .map(techCode => {
                                  return techName?.codes.find(
                                    code => code.code === techCode
                                  ) as ICode;
                                })
                                .filter(code => !!code)
                            );
                            setAreaIndex(idx);
                          }}
                          cursor="pointer"
                        />
                        <S.CancelIcon
                          width={10}
                          height={10}
                          onClick={() => {
                            setAreas(areas.filter((_, idx2) => idx2 !== idx));
                            setDeleteAreas(prev => [...prev, area]);
                          }}
                          src={XBtn}
                          alt=""
                        />
                      </S.GatherFieldBox>
                    );
                  })}
                </S.Boxs>
              )}
            </Flex>
          </InputTemplate>,
        ]}
      />
      <SubTitleTemplate
        title="자격 요건"
        components={[
          <InputTemplate key="national_license" title="국가자격증">
            <Flex direction="column" gap={8} style={{ width: 604 }}>
              <Button
                type="button"
                variant="outline"
                onClick={() => openModal("LICENSE")}
              >
                추가
              </Button>
              <S.LicenseList>
                {licenses.map((license, idx) => (
                  <S.SelectedLicense key="lincense">
                    <Text
                      fontSize="body3"
                      fontWeight="regular"
                      whiteSpace="no-wrap"
                    >
                      {license}
                    </Text>
                    <Icon
                      icon="Close"
                      size={16}
                      onClick={() =>
                        setLicenses(licenses.filter((_, idx2) => idx !== idx2))
                      }
                      cursor="pointer"
                    />
                  </S.SelectedLicense>
                ))}
              </S.LicenseList>
            </Flex>
          </InputTemplate>,
          <InputTemplate key="additional_qualifications" title="기타 자격 요건">
            <Flex direction="column" gap={8}>
              <Textarea
                width={604}
                placeholder="기타 자격 요건"
                {...register("additional_qualifications")}
              />
            </Flex>
          </InputTemplate>,
        ]}
      />
      <SubTitleTemplate
        title="근무 조건"
        components={[
          <InputTemplate key="working_hours" title="근무시간" required>
            <Flex direction="column" gap={8}>
              {watch("flexible_working") ? (
                <Input
                  width={604}
                  placeholder="직접입력"
                  {...register("working_hours", {
                    required: {
                      value: watch("flexible_working"),
                      message: "필수 입력항목입니다.",
                    },
                  })}
                  errorMessage={errors.working_hours?.message}
                />
              ) : (
                <Flex align="center" gap={22}>
                  <Controller
                    control={control}
                    name="start_time"
                    defaultValue=""
                    rules={{
                      required: "필수 입력 항목입니다.",
                      pattern: {
                        value: /^([01][0-9]|2[0-3]):([0-5][0-9])$/,
                        message: "유효한 시간 형식이 아닙니다. (ex: hh:mm)",
                      },
                    }}
                    render={({ field }) => (
                      <Input
                        {...field}
                        width={272}
                        maxLength={5}
                        placeholder="hh:mm"
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          field.onChange(regex.time(e.target.value))
                        }
                        errorMessage={errors.start_time?.message}
                      />
                    )}
                  />
                  <Text fontSize="h5" color={themes.Color.grayScale[60]}>
                    ~
                  </Text>
                  <Controller
                    control={control}
                    defaultValue=""
                    name="end_time"
                    rules={{
                      required: "필수 입력 항목입니다.",
                      pattern: {
                        value: /^([01][0-9]|2[0-3]):([0-5][0-9])$/,
                        message: "유효한 시간 형식이 아닙니다. (ex: hh:mm)",
                      },
                    }}
                    render={({ field }) => (
                      <Input
                        {...field}
                        width={272}
                        maxLength={5}
                        placeholder="hh:mm"
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          field.onChange(regex.time(e.target.value))
                        }
                        errorMessage={errors.end_time?.message}
                      />
                    )}
                  />
                </Flex>
              )}
              <Checkbox
                checked={watch("flexible_working")}
                {...register("flexible_working")}
              >
                유연근무제
              </Checkbox>
            </Flex>
          </InputTemplate>,
          <InputTemplate key="train_pay" title="실습수당" required>
            <Controller
              control={control}
              name="train_pay"
              rules={{ required: "필수 입력 항목입니다." }}
              render={({ field }) => (
                <Input
                  {...field}
                  width={604}
                  placeholder="직접입력"
                  maxLength={30}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    field.onChange(regex.money(e.target.value))
                  }
                  icon={
                    <Text
                      fontSize="body2"
                      fontWeight="regular"
                      color={themes.Color.grayScale[60]}
                    >
                      원/월
                    </Text>
                  }
                  errorMessage={errors.train_pay?.message}
                />
              )}
            />
          </InputTemplate>,
          <>
            {!recruitmentDetail?.winter_intern && (
              <InputTemplate key="pay" title="정규직 전환 시">
                <Controller
                  control={control}
                  name="pay"
                  render={({ field }) => (
                    <Input
                      {...field}
                      width={604}
                      placeholder="직접입력"
                      maxLength={30}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        field.onChange(regex.money(e.target.value))
                      }
                      errorMessage={errors.pay?.message}
                      icon={
                        <Text
                          fontSize="body2"
                          fontWeight="regular"
                          color={themes.Color.grayScale[60]}
                        >
                          만원/년
                        </Text>
                      }
                    />
                  )}
                />
              </InputTemplate>
            )}
          </>,
          <InputTemplate key="benefits" title="복리후생">
            <Flex direction="column" gap={8}>
              <Input
                width={604}
                placeholder="직접입력"
                {...register("benefits")}
                errorMessage={errors.benefits?.message}
              />
              {!recruitmentDetail?.winter_intern && (
                <Checkbox
                  checked={watch("military_support")}
                  {...register("military_support")}
                >
                  산업 기능 요원 근무 가능 여부
                </Checkbox>
              )}
            </Flex>
          </InputTemplate>,
        ]}
      />
      <SubTitleTemplate
        title="채용 절차"
        components={[
          <InputTemplate key="procedure" title="선발절차" required>
            <Flex direction="column" gap={10}>
              <S.ProcessButton onClick={() => openModal("HIRING_PROGRESS")}>
                <Text fontSize="body2" fontWeight="regular">
                  절차 추가하기
                </Text>
                <Icon icon="Plus" color={themes.Color.primary[20]} />
              </S.ProcessButton>
            </Flex>
          </InputTemplate>,
          <InputTemplate key="submit_document" title="제출서류" required>
            <Flex direction="column" gap={8}>
              <Input
                width={604}
                placeholder="직접입력"
                {...register("submit_document")}
                errorMessage={errors.submit_document?.message}
              />
              <Flex gap={20}>
                <Checkbox
                  name="self_introduction"
                  checked={!submitDocumentOption.self_introduction}
                  onChange={changeCheckbox}
                >
                  자기소개서
                </Checkbox>
                <Checkbox
                  name="resume"
                  checked={!submitDocumentOption.resume}
                  onChange={changeCheckbox}
                >
                  이력서
                </Checkbox>
                <Checkbox
                  name="portfolio"
                  checked={!submitDocumentOption.portfolio}
                  onChange={changeCheckbox}
                >
                  포트폴리오
                </Checkbox>
              </Flex>
            </Flex>
          </InputTemplate>,
          <InputTemplate key="etc" title="기타사항">
            <Textarea
              width={604}
              placeholder="직접입력"
              {...register("etc")}
              errorMessage={errors.etc?.message}
            />
          </InputTemplate>,
          <InputTemplate key="availability" title="전환 가능 여부">
            <Flex style={{ width: 604 }}>
              <Checkbox
                name="self_introduction"
                checked={!submitDocumentOption.self_introduction}
                onChange={changeCheckbox}
              >
                채용 전환 가능
              </Checkbox>
            </Flex>
          </InputTemplate>,
        ]}
      />
      <Flex justify="flex-end" gap={12} style={{ width: 850 }}>
        <Link href={"/my"}>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              reset();
              setAlwaysRecruit(false);
              resetArea();
              resetTechList();
              setLicenses([]);
            }}
          >
            취소
          </Button>
        </Link>
        <Button type="submit">수정</Button>
      </Flex>
      {modalState === "HIRING_PROGRESS" && (
        <Modal width={780} onClose={closeModal} closeAble>
          <ProgressModal
            hiringProgressArray={hiringProgress}
            setRecruitmentFormDetailInfo={setHiringProgress}
          />
        </Modal>
      )}
      {modalState === "GATHER_FIELD" && (
        <Modal
          width={800}
          onClose={() => {
            closeModal();
            resetArea();
            resetTechList();
          }}
          closeAble
        >
          <GatherModal
            setForm={setAreas}
            areaIndex={areaIndex}
            setAreaIndex={setAreaIndex}
          />
        </Modal>
      )}
      {modalState === "LICENSE" && (
        <Modal
          width={700}
          onClose={() => {
            closeModal();
            setAreaIndex(null);
          }}
        >
          <LicenseModal
            requiredLicensesArray={licenses}
            setForm={setLicenses}
          />
        </Modal>
      )}
      {modalState === "USE_TECH" && (
        <Modal
          width={700}
          onClose={() => {
            openModal("GATHER_FIELD");
            resetTechList();
          }}
          closeAble
        >
          <TechModal />
        </Modal>
      )}
    </S.Container>
  );
}
