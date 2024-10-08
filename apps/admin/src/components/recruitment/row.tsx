import { css, styled } from "styled-components";
import { Text } from "@jobis/ui";
import { themes } from "@jobis/design-token";
import { RecruitmentCellData } from "@/constants";
import { getValueByKey } from "@/utils";
import { Checkbox, Stack } from "@/components";
import { ApplicantModal } from "@/pages";
import type { RecruitmentFormType } from "@/apis";
import { useModal, useSelectRecruitmentId } from "@/stores";
import { useNavigate } from "react-router-dom";
import {
  CompanyStatusColor,
  CompanyStatusKrToEn,
  CompanyTypeEnToKr,
} from "@/@types/enums";

export type PropsType = {
  data: RecruitmentFormType;
};

export const RecruitmentRow = ({ data }: PropsType) => {
  const { openModal } = useModal();
  const navigate = useNavigate();
  const {
    selectRecruitmentId,
    addSelectRecruitmentId,
    deleteSelectRecruitmentId,
  } = useSelectRecruitmentId();

  const isSelect = selectRecruitmentId.includes(data.id);

  const clickHandler = () => {
    if (isSelect) {
      deleteSelectRecruitmentId(data.id);
    } else {
      addSelectRecruitmentId(data.id);
    }
  };

  return (
    <Container position="relative" align="center" onClick={clickHandler}>
      <CheckboxWrapper className="checkbox">
        <Checkbox checked={isSelect} onChange={() => {}} />
      </CheckboxWrapper>
      <StyleText
        $width={RecruitmentCellData[0].width}
        fontSize="body2"
        fontWeight="medium"
        $color={CompanyStatusColor[data.status]}
        style={{ justifyContent: "flex-start", padding: "0px" }}
      >
        {getValueByKey(CompanyStatusKrToEn, data.status)}
      </StyleText>
      <StyleText
        $width={RecruitmentCellData[1].width}
        fontSize="body2"
        fontWeight="medium"
        $isClick={true}
        $color={themes.Color.grayScale[80]}
        onClick={e => {
          e.stopPropagation();
          navigate(`/company/${data.company_id}`);
        }}
      >
        {data.company_name}
      </StyleText>
      <StyleText
        $width={RecruitmentCellData[2].width}
        fontSize="body2"
        fontWeight="medium"
        $isClick={true}
        $color={themes.Color.grayScale[80]}
        onClick={e => {
          e.stopPropagation();
          navigate(`/recruitment/${data.id}`);
        }}
      >
        {data.hiring_jobs.replace(/,/g, " / ")}
      </StyleText>
      <StyleText
        $width={RecruitmentCellData[3].width}
        fontSize="body2"
        fontWeight="medium"
      >
        {CompanyTypeEnToKr[data.company_type]}
      </StyleText>
      <StyleText
        $width={RecruitmentCellData[4].width}
        fontSize="body2"
        fontWeight="medium"
      >
        {data.total_hiring_count}명
      </StyleText>
      <StyleText
        $width={RecruitmentCellData[5].width}
        fontSize="body2"
        fontWeight="medium"
        $isClick={!!data.application_requested_count}
        onClick={e => {
          if (data.application_requested_count) {
            e.stopPropagation();
            openModal({
              children: (
                <ApplicantModal
                  isRequest={true}
                  status="REQUESTED"
                  id={data.id}
                />
              ),
            });
          }
        }}
      >
        {data.application_requested_count}명
      </StyleText>
      <StyleText
        $width={RecruitmentCellData[6].width}
        fontSize="body2"
        fontWeight="medium"
        $isClick={!!data.application_approved_count}
        onClick={e => {
          if (data.application_approved_count) {
            e.stopPropagation();
            openModal({
              children: (
                <ApplicantModal
                  isRequest={false}
                  status="APPROVED"
                  id={data.id}
                />
              ),
            });
          }
        }}
      >
        {data.application_approved_count}명
      </StyleText>
      <StyleText
        $width={RecruitmentCellData[7].width}
        fontSize="body2"
        fontWeight="medium"
      >
        {data.start_date || "상시모집"}
      </StyleText>
      <StyleText
        $width={RecruitmentCellData[8].width}
        fontSize="body2"
        fontWeight="medium"
        style={{ justifyContent: "flex-end", padding: "0px" }}
      >
        {data.end_date || "상시모집"}
      </StyleText>
    </Container>
  );
};

const Container = styled(Stack)`
  cursor: pointer;
  border-bottom: 1px solid ${themes.Color.grayScale[40]};

  &:hover {
    background-color: ${themes.Color.grayScale[30]};

    .checkbox {
      background-color: ${themes.Color.grayScale[30]};

      :first-child {
        border-color: ${themes.Color.grayScale[10]};

        :checked {
          border: none;
        }
      }
    }
  }
`;

const CheckboxWrapper = styled.div`
  position: absolute;
  left: -40px;
  display: flex;
  align-items: center;
  width: 40px;
  height: calc(100% + 2px);
  border-bottom: 1px solid ${themes.Color.grayScale[40]};
  border-top: 1px solid ${themes.Color.grayScale[40]};
  cursor: pointer;
`;

const StyleText = styled(Text)<{
  $width: string;
  $isClick?: boolean;
  $color?: string;
}>`
  display: flex;
  justify-content: center;
  align-items: center;
  width: ${({ $width }) => $width};
  height: 80px;
  padding: 0 8px;

  word-break: keep-all;

  text-align: center;
  ${({ $isClick }) =>
    $isClick &&
    css`
      text-decoration: underline;
      text-underline-offset: 2px;
    `}
  ${({ $color }) =>
    $color &&
    css`
      color: ${$color};
    `}
`;
