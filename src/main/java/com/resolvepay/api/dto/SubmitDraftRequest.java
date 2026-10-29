package com.resolvepay.api.dto;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SubmitDraftRequest {

    @Size(max = 20000, message = "Draft text cannot exceed 20,000 characters")
    private String draftText;

}
